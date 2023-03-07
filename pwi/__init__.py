import flask
from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash, make_response
from flask_cache import Cache
import flask_login
from flask_login import LoginManager, current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json

import logging
import os
import sys
import traceback
import time
import string
from datetime import datetime
import numbers

import db

dbinfo = db.sql("select * from mgi_dbinfo")
print (dbinfo)

for p in sys.path:
    print(p)

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

# set the secret key.  keep this really secret:
app.secret_key = 'ThisIsASecretKey;-)'

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

# prepare the db connections for all requests
@app.before_request
def before_request():
    if 'user' not in session:
                session['user'] = ''
        
@app.errorhandler(500)
def server_error(e):
    
    return render_template('500.html',
                error=e,
                traceback=traceback), 500

# create the login manager
login_manager = LoginManager()
login_manager.init_app(app)

from login import login_util

@login_manager.user_loader
@cache.memoize()
def load_user(userid):
    return login_util.getMgiUser(userid)

json = FlaskJSON(app)
@json.encoder
def encoder(o):
    if o != None:
        if not isinstance(o, datetime) and not isinstance(o, numbers.Number):
            return o.__dict__
        else:
            return str(o) 

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
        
    if 'edits' not in session:
        session['edits'] = {}
        
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
            
                    flash('Logged in successfully.')
            
                    return redirect(next or url_for('index'))
                
            error = "user or password is invalid"

    return render_template('authenticate.html',
            error=error,
            user=user,
            next=next
    )
    

@app.route(APP_PREFIX+'/logout')
def logout():
        session['user']=None
        session['password']=None
        session['authenticated'] = False
        
        flask_login.logout_user()
        next = request.args.get('next')
        
        return redirect(next or url_for('index'))

@app.route(APP_PREFIX+'/loggedin')
@as_json
def loggedin () :
    return flask_login.current_user
    
#register blueprints
def registerBlueprint(bp):
    url_prefix = APP_PREFIX + bp.url_prefix
    app.register_blueprint(bp, url_prefix=url_prefix)
  
# edit pages
from views.edit.blueprint import edit as editBlueprint
registerBlueprint(editBlueprint)

if __name__ == '__main__':
        app.debug = DEBUG
        app.run(host='mgi-testdb4')

