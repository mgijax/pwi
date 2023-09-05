import os
import sys
import traceback
from datetime import datetime
import numbers

from flask import Flask, request, session, redirect, url_for, render_template 
from flask_json import FlaskJSON, as_json

import db

def log (s):
    print (s, flush=True)

dbinfo = db.sql("select * from mgi_dbinfo")
db.commit()
log(dbinfo)

for p in sys.path:
    log(p)

# configuration from environment
PWI = os.environ["PWI"]
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
WEBSHARE_URL = os.environ["WEBSHARE_URL"]
PWIREPORT_URL = os.environ["PWIREPORT_URL"]
QCRPTS_URL = os.environ["PWIREPORT_URL"].replace("pwi", "qcr.shtml")

# application object
folder = PWI + APP_PREFIX + "/static"
log("Static content folder: " + folder)
app = Flask(__name__, static_folder=folder, static_url_path="/pwi/static")

# this import must come after the app is created.
import login_util

# set the secret key.  keep this really secret:
app.secret_key = 'ThisIsASecretKey;-)'

# set all constants defined above this line to the app.config object
app.config.from_object(__name__)
# load any specific settings for this environment (e.g. prod/dev/test)
app.config.from_envvar("APP_CONFIG_FILE")
app.config['JSON_ADD_STATUS'] = False

# reset any overrides
APP_PREFIX = app.config['APP_PREFIX']

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html',
                error=e,
                traceback=traceback,
		endpointName=""), 500

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
    return response

# root view
@app.route(APP_PREFIX+'/')
def index():
    return render_template('index.html', hide_submenu=True, endpointName="")

# edit pages
from blueprint import edit 
url_prefix = APP_PREFIX + edit.url_prefix
app.register_blueprint(edit, url_prefix=url_prefix)

log(app.config)

if __name__ == '__main__':
        app.debug = DEBUG
        app.run(host='mgi-testdb4')

