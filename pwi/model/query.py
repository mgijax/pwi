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
		
# 	# TODO(kstone): remove after the flip
# 	if app.config["DBTYPE"] == "Sybase":
# 		con.execute('commit transaction')
# 		pass
		
		
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

# 	def doQuery(q):
# 		con = db.session.connection()
# 		results = con.execute(q)
# 		columnDefs = results.keys()	
# 		if results.returns_rows:
# 			results = results.fetchall()
# 		else:
# 			results = []
# 		return results, columnDefs
# 		
# 	if app.config["DBTYPE"] == "Sybase":
# 		def sybaseQuery(q):
# 			import pyodbc
# 			conn = pyodbc.connect("DSN=%s;UID=%s;PWD=%s" % \
# 				(app.config["SYBASE_SERVER"],app.config["SYBASE_USER"],app.config["SYBASE_PASS"]))
# 			conn.execute('commit transaction')
# 			cur = conn.cursor()
# 			cur.execute(q)
# 			results = []
# 			columnDefs = []
# 			if cur.description:
# 				columnDefs = [c[0] for c in cur.description]
# 				results = cur.fetchall()
# 			return results, columnDefs
# 		doQuery = sybaseQuery
# 		
# 		
# 	results = []
# 	columnDefs = []
# 	try:
# 		results, columnDefs = doQuery(query)
# 	except exc.SQLAlchemyError, e:
# 		# wrap the error in something generic, so we can hide the sybase implementation
# 		raise QueryError(e.message)
# 
# 	return results, columnDefs

def getTablesInfo():
	if app.config["DBTYPE"] == "Sybase":
		# HACK: metadata reflection is currently throwing an error in sybase
		# TODO: need to find a fix so that we can always use SQA reflection
		return [x[0] for x in performQuery("select name from sysobjects where type='U' order by name")[0]]
	#else
	db.metadata.reflect(db.engine)
	#print "db keys = "%db.metadata.tables.keys()
	return db.metadata.tables.keys()

def dbLogin(user,password):
	"""
	returns if user can login
	Does so by using sqlalchemy connect on the 
		appropriate db engine
	If successful, returns the session bound to
		created engine
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
	session = None
	try:
		engine = db.create_engine(dburi)
		engine.connect()
		
		session = db.scoped_session(
			db.sessionmaker(autocommit=False, 
						autoflush=False, 
						bind=engine)
		)
	except:
		return False

	return session
	   
	   
def batchLoadAttribute(objects, attribute, 
					batchSize=100,
					loadAll=False):
	"""
	Takes in a homogenous list of SQAlchemy model instances
	and a lazy attribute to be loaded
	Performs a query to load this attribute for all
	the model instances
	
	Supports dot object notation for loading nested relations
	E.g. batchLoadAttribute(imagepanes, 'insituresults.specimen.assay.marker')
		Will load the marker for every assay in each specimen for each insituresult
		
	If loadAll is set, then every attribute in the dot object chain will be loaded (or reloaded)
	
	Note: be wary when using this, as it detaches the attribute from the sql alchemy session
	Note 2: Now works for composite primary keys
	Note 3: Now takes into account "uselist" property of relationship
	"""
	
	attributeChain = attribute.split(".")
	
	for i in range(0, len(attributeChain)):
		
		attribute = attributeChain[i]
		
		# only batch load the last item in chain
		if loadAll or (i == len(attributeChain) - 1):
			_batchLoadAttribute(objects, attribute, batchSize)
		
		# if there are more attributes, reset objects
		# to be the collection of children attributes 
		# 	for each original object in the chain
		if (i < len(attributeChain) - 1):
			child_objects = []
			for object in objects:
				child = getattr(object, attribute)
				if child:
					if isinstance(child, list):
						child_objects.extend(child)
						for item in child:
							if item:
								child_objects.append(item)
					else:
						child_objects.append(child)
					
			objects = child_objects
	
	
def _batchLoadAttribute(objects, attribute, batchSize=100):
	"""
	Does not accept dot object notation
	Loads only a single attribute for each object
	"""
	
	if objects:
		refObject = objects[0]
		# reflect some of the necessary sqlalchemy configuration
		# original object model Class
		entity = refObject.__mapper__.entity
		# primary key names
		pkNames = [pk.key for pk in refObject.__mapper__.primary_key]
		# primary keys property class
		pkAttributes = [getattr(entity, pkName) for pkName in pkNames]
		# attribute property class
		loadAttribute = getattr(entity, attribute)
		# attribute entity class
		attributeClass = loadAttribute.property.mapper.entity
		# any attibute order_by clause
		order_by = loadAttribute.property.order_by
		
		uselist = loadAttribute.property.uselist
		
		#app.logger.debug('pkeys = %s' % pkNames)
		#app.logger.debug('pkAttr = %s' % pkAttributes)
		
		for batch in batch_list(objects, batchSize):
			# gen lists of primary keys
			primaryKeyLists = [[getattr(o, pkName) for o in batch] for pkName in pkNames] 
			
			#app.logger.debug('pkLists = %s' % primaryKeyLists)
			
			# query second list with attribute loaded
			query = entity.query.add_entity(attributeClass).join(loadAttribute)
			
			# filter by every primary key on the object
			for idx in range(len(pkNames)):
				pkName = pkNames[idx]
				pkAttribute = pkAttributes[idx]
				primaryKeys = primaryKeyLists[idx]
				query = query.filter(pkAttribute.in_(primaryKeys))
			
			# defer everything but primary keys
			query = query.options(*defer_everything_but(entity, pkNames))
			
			# preserve original order by on the attribute relationship
			if order_by:
				query = query.order_by(*order_by)
				
			loadedObjects =  query.all()
			
			# make a lookup to match on primary key
			loadedLookup = {}
			for loadedObject in loadedObjects:
				
				pkey = tuple([getattr(loadedObject[0], pkName) for pkName in pkNames])
				#app.logger.debug('found pkey = %s' % pkey)
				if uselist:
					loadedLookup.setdefault(pkey, []).append(loadedObject[1])
				else:
					loadedLookup[pkey] = loadedObject[1]
			
			
			# match any found attributes from the loaded set
			for object in batch:
				loadedAttr = []
				if not uselist:
					loadedAttr = None
					
				pkey = tuple([getattr(object, pkName) for pkName in pkNames])
				if pkey in loadedLookup:
					loadedAttr = loadedLookup[pkey]
					
				orm.attributes.set_committed_value(object, attribute, loadedAttr)

def batchLoadAttributeExists(objects, attributes, batchSize=100):
	"""
	Takes in a homogenous list of SQAlchemy model instances
	and a list of attributes to be loaded
	Performs a query to load these attribute for all
	the model instances
	
	Note: objects must have a single primary key
	
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
	
def batchLoadAttributeCount(objects, attribute, batchSize=100):
	"""
	Takes in a homogenous list of SQAlchemy model instances
	and an attribute to be loaded
	Performs a query to load this attribute for all
	the model instances
	
	Note: objects must have a single primary key
	
	Assigns count attribute as '<attribute>_count' (e.g. marker.alleles_count)
	"""

	if objects and attribute:
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
			
			# attribute property class
			loadAttribute = getattr(entity, attribute)
			# get primary key of attribute to load, so we have
			#	something to count for each group
			loadAttributePk = loadAttribute.property.table.primary_key
			columns.append(db.func.count())
			
			query = db.session.query(*columns).join(loadAttribute).filter(pkAttribute.in_(primaryKeys))
			
			# group by entity's primary key
			query = query.group_by(pkAttribute)
				
			loadedObjects =  query.all()
			
			# make a lookup to match on primary key
			loadedLookup = {}
			for loadedObject in loadedObjects:
				pkey = loadedObject[0]
				# add the list of matching boolean values 
				# 	(should align with order of passed in attributes)
				loadedLookup[pkey] = loadedObject[1]
			
			# match all the found count values with the original set
			# this shouldn't happen, but if no matching object was loaded,
			# default to 0
			attribute_name = '%s_count' % attribute
			for object in batch:
				loadedAttr = 0
				pkey = getattr(object, pkName)
				if pkey in loadedLookup:
					loadedAttr = loadedLookup[pkey]
				
				# set the attribute boolean values
				value = loadedAttr
				setattr(object, attribute_name, value)
					

def defer_everything_but(entity, cols):
	m = orm.class_mapper(entity)
	return [orm.defer(k) for k in 
			set(p.key for p 
				in m.iterate_properties 
				if hasattr(p, 'columns')).difference(cols)]



