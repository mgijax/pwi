# module to perfom custom SQL statements.
# NOTE: In most cases, we don't want to use this. Creating ORM classes for your tables is better.
#	This is merely available to make easy use of things like custom SQL, or webSQL, reports, etc

from pwi import app,db
from sqlalchemy import exc, orm
from pwi.util import batch_list
import os
import time

class QueryError(Exception):
	"""
	a custom error class to catch errors from this module
	"""

def performQuery(query):
	"""
	Performs arbitrary SQL query
	against the currently configured database engine
	returns two lists,
		results,
		columnDefs
	"""
	
	ql = query.lower()
	if app.config["DBTYPE"] == "Sybase" and not ("set" in ql and "rowcount" in ql):
		query = "SET ROWCOUNT 0\n%s"%query
		
	else:
		query = query.replace('%','%%')

	con = db.session.connection()
		
	results = []
	columnDefs = []
	try:
		results = con.execute(query)
	except exc.SQLAlchemyError, e:
		# wrap the error in something generic, so we can hide the sybase implementation
		raise QueryError(e.message)
	columnDefs = results.keys()
	
	if results.returns_rows:
		results = results.fetchall()
	else:
		results = []
	return results, columnDefs

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
	"""
	returns if user can login
	Does so by using sqlalchemy connect on the 
		appropriate db engine
	"""
	dburi = ""
	if app.config['DBTYPE'] == 'Sybase':
		dburi = "sybase+pyodbc://%s:%s@%s" % \
			(user, 
			password,
			app.config['SYBASE_SERVER'])
	else:
		dburi = "postgresql+psycopg2://%s:%s@%s/%s" % \
			(user,
			password,
			app.config['PG_SERVER'],
			app.config['PG_DBNAME'])
		
	# try to connect
	success = True
	try:
		db.create_engine(dburi).connect()
	except:
		success = False

	return success
	   

	   
def batchLoadAttribute(objects, attribute, batchSize=100, uselist=True):
	"""
	Takes in a homogenous list of SQAlchemy model instances
	and a lazy attribute to be loaded
	Performs a query to load this attribute for all
	the model instances
	
	Note: be wary when using this, as it detaches the attribute from the sql alchemy session
	Note 2: Only works if object has a single column primary key
	"""
	if objects:
		refObject = objects[0]
		# reflect some of the necessary sqlalchemy configuration
		# original object model Class
		entity = refObject.__mapper__.entity
		# primary key name
		pkName = refObject.__mapper__.primary_key[0].key
		# primary key property class
		pkAttribute = getattr(entity, pkName)
		# attribute property class
		loadAttribute = getattr(entity, attribute)
		# attribute entity class
		attributeClass = loadAttribute.property.mapper.entity
		# any attibute order_by clause
		order_by = loadAttribute.property.order_by
		
		for batch in batch_list(objects, batchSize):
			# gen list of primary keys
			primaryKeys = [getattr(o, pkName) for o in batch] 
			
			# query second list with attribute loaded
			query = entity.query.add_entity(attributeClass).join(loadAttribute) \
				.filter(pkAttribute.in_(primaryKeys)) \
				.options(*defer_everything_but(entity, [pkName]))
			
			if order_by:
				query = query.order_by(*order_by)
				
			loadedObjects =  query.all()
			
			# make a lookup to match on primary key
			loadedLookup = {}
			for loadedObject in loadedObjects:
				pkey = getattr(loadedObject[0], pkName)
				if uselist:
					loadedLookup.setdefault(pkey, []).append(loadedObject[1])
				else:
					loadedLookup[pkey] = loadedObject[1]
			
			
			# match any found attributes from the loaded set
			for object in batch:
				loadedAttr = []
				if not uselist:
					loadedAttr = None
					
				pkey = getattr(object, pkName)
				if pkey in loadedLookup:
					loadedAttr = loadedLookup[pkey]
					
				orm.attributes.set_committed_value(object, attribute, loadedAttr)

def batchLoadAttributeExists(objects, attributes, batchSize=100):
	"""
	Takes in a homogenous list of SQAlchemy model instances
	and a list of attributes to be loaded
	Performs a query to load these attribute for all
	the model instances
	
	Assigns existence flags as 'has_<attribute>' (e.g. marker.has_alleles)
	"""
	if objects and attributes:
		refObject = objects[0]
		# reflect some of the necessary sqlalchemy configuration
		# original object model Class
		entity = refObject.__mapper__.entity
		# primary key name
		pkName = refObject.__mapper__.primary_key[0].key
		# primary key property class
		pkAttribute = getattr(entity, pkName)
		
		
		for batch in batch_list(objects, batchSize):
			# gen list of primary keys
			primaryKeys = [getattr(o, pkName) for o in batch] 
			
			# query second list with attribute loaded
			columns = [pkAttribute]
			for attribute in attributes:
				# attribute property class
				loadAttribute = getattr(entity, attribute)
				columns.append(loadAttribute.any())
			
			query = db.session.query(*columns).filter(pkAttribute.in_(primaryKeys))
				
			loadedObjects =  query.all()
			
			# make a lookup to match on primary key
			loadedLookup = {}
			for loadedObject in loadedObjects:
				pkey = loadedObject[0]
				# add the list of matching boolean values 
				# 	(should align with order of passed in attributes)
				loadedLookup[pkey] = loadedObject[1:]
			
			# match all the found boolean values with the original set
			# this shouldn't happen, but if no matching object was loaded,
			# default to False
			attribute_names = ['has_%s' % attr for attr in attributes]
			for object in batch:
				loadedAttrs = []
				pkey = getattr(object, pkName)
				if pkey in loadedLookup:
					loadedAttrs = loadedLookup[pkey]
				
				for i in range(0, len(attributes)):
					# set the attribute boolean values
					value = len(loadedAttrs) > i and loadedAttrs[i] or False
					setattr(object, attribute_names[i], value)
					

def defer_everything_but(entity, cols):
	m = orm.class_mapper(entity)
	return [orm.defer(k) for k in 
			set(p.key for p 
				in m.iterate_properties 
				if hasattr(p, 'columns')).difference(cols)]



