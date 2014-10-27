# module to perfom custom SQL statements.
# NOTE: In most cases, we don't want to use this. Creating ORM classes for your tables is better.
#	This is merely available to make easy use of things like custom SQL, or webSQL, reports, etc

from pwi import app,db
from sqlalchemy import exc
import os
import time

# a custom error class to catch errors from this module
class QueryError(Exception):
	pass

def performQuery(query):
	results=None
	ql = query.lower()
	if app.config["DBTYPE"] == "Sybase" and not ("set" in ql and "rowcount" in ql):
		query = "SET ROWCOUNT 0\n%s"%query
	con = db.session.connection()
	results = []
	col_defs = []
	try:
		results = con.execute(query)
	except exc.SQLAlchemyError, e:
		# wrap the error in something generic, so we can hide the sybase implementation
		raise QueryError(e.message)
	col_defs = results.keys()
	return results.fetchall(),col_defs

def getTablesInfo():
	if app.config["DBTYPE"] == "Sybase":
		# HACK: metadata reflection is currently throwing an error in sybase
		# TODO: need to find a fix so that we can always use SQA reflection
		return [x[0] for x in performQuery("select name from sysobjects where type='U' order by name")[0]]
	#else
	db.metadata.reflect(db.engine)
	#print "db keys = "%db.metadata.tables.keys()
	return db.metadata.tables.keys()

import subprocess
def dbLogin(user,password):
	isqlPath = os.path.join(app.config['UNIXODBC_DIR'], 'bin/isql')
	p = subprocess.Popen([isqlPath,'-b',app.config['SYBASE_SERVER'],user,password],
		stdin=subprocess.PIPE,
		stdout=subprocess.PIPE,
		stderr=subprocess.PIPE)
	result, err = p.communicate('\n')
	# try to terminate process just in case
	try:
		p.terminate()
	except:
		pass

	return p.returncode == 0 and 'ERROR' not in result
