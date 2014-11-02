from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash, make_response
from flask.ext.sqlalchemy import SQLAlchemy

# import the sql alchemy patch for working with sybase 12
import FlaskSQAHack

import os

# configuration
if 'DEBUG' in os.environ and os.environ['DEBUG']=="True":
	DEBUG = True
	SQLALCHEMY_RECORD_QUERIES = True
	SQLALCHEMY_ECHO = True

UNIXODBC_DIR = os.environ["UNIXODBC_DIR"]
SYBASE_SERVER = os.environ["SYBASE_SERVER"]
SYBASE_DBNAME = os.environ["SYBASE_DBNAME"]
SYBASE_USER = os.environ["SYBASE_USER"]
SYBASE_PASS = os.environ["SYBASE_PASS"]
PG_SERVER = os.environ["PG_SERVER"]
CUR_DBSERVER = PG_SERVER
PG_DBNAME = os.environ["PG_DBNAME"]
CUR_DBNAME = PG_DBNAME
PG_USER = os.environ["PG_USER"]
PG_PASS = os.environ["PG_PASS"]
APP_SERVER = os.environ["APP_DBHOST"]
APP_DBNAME = os.environ["APP_DBNAME"]
APP_USER = os.environ["APP_DBUSER"]
APP_PASS = os.environ["APP_DBPASS"]
APP_PREFIX = os.environ["APP_PREFIX"]
REPORTS_DIR = os.environ["REPORTS_DIR"]

# Configure the database type
DBTYPE = os.environ["DBTYPE"]
SQLALCHEMY_POOL_SIZE=10

# application object
app = Flask(__name__,static_path="%sstatic"%APP_PREFIX)

# set all constants defined above this line to the app.config object
app.config.from_object(__name__)

# init DB connection
if DBTYPE=="Sybase":
	app.config['CUR_DBSERVER'] = SYBASE_SERVER
	app.config['CUR_DBNAME'] = SYBASE_DBNAME
	dburi = "sybase+pyodbc://%s:%s@%s"%(SYBASE_USER,SYBASE_PASS,
		SYBASE_SERVER)
else:
	# testing postgres dburi
	dburi = "postgresql+psycopg2://%s:%s@%s/%s"%(PG_USER,PG_PASS,
		PG_SERVER,PG_DBNAME)

appdburi = "postgresql+psycopg2://%s:%s@%s/%s"%(APP_USER,APP_PASS,
	APP_SERVER,APP_DBNAME)

# configure the multiple db binds
# 'mgd' is for mgd (whether sybase or postgres as configured above
# 'app' is a posgtres database for servicing app specific needs, and is separate from anything in mgd
app.config['SQLALCHEMY_DATABASE_URI'] = dburi
app.config['SQLALCHEMY_BINDS'] = {
	"mgd": dburi,
	"app": appdburi
}

# initialise the global db object
db = SQLAlchemy(app)
from model.query import performQuery
try:
    performQuery("select 1 from mgi_dbinfo")
except:
    pass

# set the secret key.  keep this really secret:
app.secret_key = 'ThisIsASecretKey;-)'

# prepare the db connections for all requests
@app.before_request
def before_request():
	if 'user' not in session:
		session['user'] = ''

#@app.teardown_request
#def teardown_request(exception):
#	g.sybase_db.close()

# views
from model.query import dbLogin

# root view
@app.route('/')
def index():
	return render_template('index.html')

#register blueprints
# detail pages
from views.detail.blueprint import detail as detailBlueprint
app.register_blueprint(detailBlueprint)
# accession pages
from views.accession.blueprint import accession as accessionBlueprint
app.register_blueprint(accessionBlueprint)
# summary pages
from views.summary.blueprint import summary as summaryBlueprint
app.register_blueprint(summaryBlueprint)

# initialise custom templatetags
# need to turn off autoescaping to allow nested templates inside templatetags
app.jinja_env.autoescape=False
import templatetags.summary_tags
import templatetags.query_tags
import templatetags.detail_tags
import templatetags.filters
app.jinja_env.globals.update(dynamic_summary = templatetags.summary_tags.do_dynamic_summary)
app.jinja_env.globals.update(dynamic_queryform = templatetags.query_tags.do_dynamic_queryform)
app.jinja_env.globals.update(ajax = templatetags.detail_tags.do_ajax_widget)
app.jinja_env.filters["ascii_decode"] = templatetags.filters.ascii_decode
app.jinja_env.filters["css"] = templatetags.filters.ascii_decode
app.jinja_env.filters["datetime"] = templatetags.filters.format_datetime
app.jinja_env.filters["sec_to_min"] = templatetags.filters.seconds_to_minutes
app.jinja_env.filters["type_format"] = templatetags.filters.dynamic_format
app.jinja_env.filters["super"] = templatetags.filters.superscript

if __name__ == '__main__':
	app.debug = DEBUG
	app.run(host='mgi-testdb4')
