#!./bin/python
# runs a simple test to see if Sybas module was installed properly

import pyodbc
import os
from threading import Thread

dbServer = os.environ["SYBASE_SERVER"]
dbUser = os.environ["SYBASE_USER"]
dbPass = os.environ["SYBASE_PASS"]
dbName = os.environ["SYBASE_DBNAME"]

def getDB():
	return pyodbc.connect("DSN=%s;UID=%s;PWD=%s"%(dbServer,dbUser,dbPass))

db = getDB()
db.close()
def sy_query(query,num):
	print "making new conn %s"%num
	db = getDB()
	print "making cursor %s"%num
	cur = db.cursor()
	print "executing %s\n*****"%num
	cur.execute(query)
	print "rows 1 = %s"%cur.fetchone()
	print "*************DONE*********"
	db.close()

if __name__ == "__main__":
	print "Testing sybase module by connecting to %s:%s as user %s"%(dbServer,dbName,dbUser)
	q1 = "select count(*) from gxd_structure"
	sy_query(q1,1)
	sy_query("select schema_version from mgi_dbinfo",2)

	db = getDB()
	cur = db.cursor()
	cur.execute("select * from mrk_marker where _marker_key = ?",(3,))
	db.close()
	print "completed"

#version = cur.fetchone()[0]
#print "Connection successful. %s:%s schema version = %s"%(dbServer,dbName,version)
