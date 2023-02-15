from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cache import Cache

import logging
import os
from mgipython import logger as mgipython_logger

import os
import sys
for p in sys.path:
    print(p)

#import logging_setup

# configuration from environment
PG_SERVER = os.environ["PG_SERVER"]
CUR_DBSERVER = PG_SERVER
PG_DBNAME = os.environ["PG_DBNAME"]
CUR_DBNAME = PG_DBNAME
PG_USER = os.environ["PG_USER"]
PG_PASS = os.environ["PG_PASS"]
APP_PREFIX = os.environ["APP_PREFIX"]
LOG_DIR = os.environ["LOG_DIR"]
ERROR_EMAIL = os.environ["ERROR_EMAIL"]

JAVA_API_URL = os.environ["JAVA_API_URL"]
ACCESS_TOKEN = os.environ["ACCESS_TOKEN"]

# needed for links from pwi home page
PDFVIEWER_URL = os.environ["PDFVIEWER_URL"]
PDFSPLITTER_URL= os.environ["PDFSPLITTER_URL"]
PIXDB_URL = os.environ["PIXDB_URL"]
PRISM_URL = os.environ["PRISM_URL"]
WEBSHARE_URL = os.environ["WEBSHARE_URL"]
PWIREPORT_URL = os.environ["PWIREPORT_URL"]

# application object
app = Flask(__name__,static_path="%s/static"%APP_PREFIX)

# set all constants defined above this line to the app.config object
app.config.from_object(__name__)
# load any specific settings for this environment (e.g. prod/dev/test)
app.config.from_envvar("APP_CONFIG_FILE")
app.config['JSON_ADD_STATUS'] = False

# reset any overrides
APP_PREFIX = app.config['APP_PREFIX']

# setup application caching
#    default timeout of 2 minutes per resource
cache = Cache(app, config={
        'CACHE_TYPE' : 'filesystem',
        'CACHE_DIR' : '/tmp/pwicache',
        'CACHE_DEFAULT_TIMEOUT' : 120
    })

# setup all the logging for our app
def setupLogging(app):
    """
    Sets up logging handlers for the pwi app
    
    1) Sets level and handler for mgipython library logging
    2) WRITE_APP_LOG determines if we write to a file
    3) EMAIL_ON_ERROR deterimines if we send email on errors
    """
    
    # open up global logger so we can fine tune the individual handlers
    app.logger.setLevel(logging.DEBUG)
    mgipython_logger.setLevel(logging.DEBUG)
    
    ch = logging.StreamHandler()
    mgipython_logger.addHandler(ch)
    
    # configure logging when not in debug mode
    if 'WRITE_APP_LOG' in app.config and app.config['WRITE_APP_LOG']:
        
        # make a file logger that rotates every day
        from logging.handlers import TimedRotatingFileHandler
        file_handler = TimedRotatingFileHandler(os.path.join(app.config['LOG_DIR'], "app.log"),
                                    when='D',
                                    interval=1,
                                    backupCount=14)
        
        
        # set the logging level for the app log
        logLevel = logging.WARNING
        if 'LOG_LEVEL' in app.config:
            logLevelConfig = app.config['LOG_LEVEL'].lower()
            if logLevelConfig == 'debug':
                logLevel = logging.DEBUG
            elif logLevelConfig == 'info':
                logLevel = logging.INFO
            elif logLevelConfig == 'warn' or logLevel == 'warning':
                logLevel = logging.WARNING
            elif logLevelConfig == 'error':
                logLevel = logging.ERROR
                
            
        mgipython_logger.setLevel(logLevel)
        file_handler.setLevel(logLevel)
        
        formatter = logging.Formatter('%(asctime)s %(levelname)s] - %(message)s')
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
        
        from flask import request
        @app.before_request
        def log_requests():
            app.logger.info("ACCESS - \"%s\"" % request.path)
            
    if 'EMAIL_ON_ERROR' in app.config and app.config['EMAIL_ON_ERROR'] \
            and app.config['ERROR_EMAIL']:
        
         # send email to ERROR_EMAIL on any error occurrence
        from logging.handlers import SMTPHandler
        mail_handler = SMTPHandler('smtp.jax.org',
                                   'pwi-error@informatics.jax.org',
                                   app.config['ERROR_EMAIL'].split(','), 'PWI Error')
        mail_handler.setLevel(logging.ERROR)
        app.logger.addHandler(mail_handler)

setupLogging(app)
        
# testing postgres dburi
dburi = "postgresql+psycopg2://%s:%s@%s/%s"%(PG_USER,PG_PASS,PG_SERVER,PG_DBNAME)

# configure the multiple db binds
# 'mgd' is for mgd 
app.config['SQLALCHEMY_DATABASE_URI'] = dburi
app.config['SQLALCHEMY_BINDS'] = { "mgd": dburi, }

# initialise the global db object
from mgipython import modelconfig
modelconfig.createDatabaseEngineFromApp(app, appCache=cache)
db = modelconfig.db

from mgipython.model.query import performQuery
try:
    performQuery("select 1 from mgi_dbinfo")
except:
    pass

# Set logging for pretty printed queries
from login.literalquery import literalquery
from datetime import datetime
import sqlparse
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.event import listens_for
from sqlalchemy.orm.query import Query
import traceback
import time
import string

# set the secret key.  keep this really secret:
app.secret_key = 'ThisIsASecretKey;-)'

# prepare the db connections for all requests
@app.before_request
def before_request():
    if 'user' not in session:
                session['user'] = ''
        
    commit_enabled = True
    if"NO_DB_COMMIT" in app.config and app.config["NO_DB_COMMIT"]:
        commit_enabled = False
        
    if commit_enabled:
        # prevent any database session autoflush
        db.session.autoflush = False
        db.session.close()

@app.teardown_appcontext
def shutdown_session(exception=None):
    
    commit_enabled = True
    if"NO_DB_COMMIT" in app.config and app.config["NO_DB_COMMIT"]:
        commit_enabled = False
        
    if commit_enabled:
        #db.session.rollback()
        db.session.expunge_all()
        db.session.close()

import traceback
@app.errorhandler(500)
def server_error(e):
    
    return render_template('500.html',
                error=e,
                traceback=traceback), 500

# views
from login import login_util
import flask_login
from flask_login import LoginManager, current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from mgipython.model.mgd.mgi import MGIUser
import flask
import numbers

json = FlaskJSON(app)
@json.encoder
def encoder(o):
    if o != None:
        if not isinstance(o, datetime) and not isinstance(o, numbers.Number):
            return o.__dict__
        else:
            return str(o) 

# create the login manager
login_manager = LoginManager()
login_manager.init_app(app)

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    #print response.headers 
    return response

# prepare the db connections for all requests
@app.before_request
def before_request():
    
    if current_user and current_user.is_authenticated:
        session['user'] = current_user.login
        session['authenticated'] = True
    
    if 'user' not in session:
        session['user'] = ''
    if 'authenticated' not in session:
        session['authenticated'] = False
        
    if session['user']:
        login_util.refreshLogin(session['user'])
        
    if 'edits' not in session:
        session['edits'] = {}
        
    # prevent any database session autoflush
    db.session.autoflush = False

@login_manager.user_loader
@cache.memoize()
def load_user(userid):
    return MGIUser.query.filter_by(login=userid).first()

# root view
@app.route(APP_PREFIX+'/')
def index():
    return render_template('index.html',
                           hide_submenu=True
                           )

@app.route(APP_PREFIX+'/login',methods=['GET','POST'])
def login():
    # Here we use a class of some kind to represent and validate our
    # client-side form data. For example, WTForms is a library that will
    # handle this for us.
    error=""
    user=""
    next=""
    if request.method=='POST':
            form = request.form
            user = 'user' in form and form['user'] or ''    
            password = 'password' in form and form['password'] or ''
            next = 'next' in form and form['next'] or ''
            
            #get user and log them the heck in
            userObject = login_util.mgilogin(user, password)
                
            if userObject:
                    # successful login
                    session['user']=user
                    session['password']=password
                    session['authenticated'] = True
                    # Login and validate the user.
                    flask_login.login_user(userObject, remember=True)
            
                    flask.flash('Logged in successfully.')
            
                    #if not next_is_valid(next):
                    #    return flask.abort(400)
            
                    return flask.redirect(next or flask.url_for('index'))
                
            error = "user or password is invalid"

    return render_template('authenticate.html',
            error=error,
            user=user,
            next=next
    )
    
@app.route(APP_PREFIX+'/logout')
def logout():
        if session['user']:
            login_util.mgilogout(session['user'])
        
        session['user']=None
        session['password']=None
        session['authenticated'] = False
        
        flask_login.logout_user()
        next = flask.request.args.get('next')
        
        #if not next_is_valid(next):
        #    return flask.abort(400)

        return flask.redirect(next or flask.url_for('index'))
    
#register blueprints
def registerBlueprint(bp):
    url_prefix = APP_PREFIX + bp.url_prefix
    app.register_blueprint(bp, url_prefix=url_prefix)
  
# api endpoints
from views.api.blueprint import api_bp as apiBlueprint
registerBlueprint(apiBlueprint)                         
# edit pages
from views.edit.blueprint import edit as editBlueprint
registerBlueprint(editBlueprint)

#db.session.commit()
db.session.close()

if __name__ == '__main__':
        app.debug = DEBUG
        app.run(host='mgi-testdb4')

