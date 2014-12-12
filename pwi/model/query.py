# module to perfom custom SQL statements.
# NOTE: In most cases, we don't want to use this. Creating ORM classes for your tables is better.
#	This is merely available to make easy use of things like custom SQL, or webSQL, reports, etc

from pwi import app,db
from sqlalchemy import exc, orm
from pwi.util import batch_list
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



