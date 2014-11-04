"""
	Contains core functions and classes for working with SQL Alchemy
"""
from pwi import db,app
from sqlalchemy.orm import class_mapper, defer, attributes

class MGIModel:
        __table_args__ = {"useexisting": True}
        if app.config["DBTYPE"] == "Postgres":
                __table_args__["schema"] = "mgd"
        # define a method to retrieve the current table subclass
        @classmethod
        def getSubClass(cls):
                return cls 
        # make this class iterable, and return the values of each column
        def __iter__(self):
                for col in getColumnNames(self.getSubClass()):
                        yield self.__getattribute__(col)
     
        @property
        def _primary_key(self):
                return getPrimaryKey(self)

def getPrimaryKey(object):
        return object.__mapper__.primary_key_from_instance(object)[0]

def mgi_table(tableName,*others):
        if app.config["DBTYPE"] == "Postgres":
                tableName = "mgd."+tableName
        table = db.Table(tableName,*others,quote=False)
        return table
def mgi_fk(fkString):
	if app.config["DBTYPE"] == "Postgres":
		fkString = "mgd."+fkString
	fk = db.ForeignKey(fkString)
	return fk

def getColumnNames(dbModel):
        colnames = []
        for colname,col in dbModel.__mapper__.columns.items():
                if not isColumnHidden(col):
                        colnames.append(colname)
        return colnames
# takes in a SQA column object
def isColumnHidden(col):
        return "hidden" in dir(col) and col.hidden
       
def batchLoad(objects, attribute, batchSize=100):
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
				loadedLookup.setdefault(pkey, []).append(loadedObject[1])
			
			
			# match any found attributes from the loaded set
			for object in batch:
				loadedAttr = []
				pkey = getattr(object, pkName)
				if pkey in loadedLookup:
					loadedAttr = loadedLookup[pkey]
					
				attributes.set_committed_value(object, attribute, loadedAttr)
	

def defer_everything_but(entity, cols):
    m = class_mapper(entity)
    return [defer(k) for k in 
            set(p.key for p 
                in m.iterate_properties 
                if hasattr(p, 'columns')).difference(cols)]


def batch_list(iterable, n = 1):
   l = len(iterable)
   for ndx in range(0, l, n):
       yield iterable[ndx:min(ndx+n, l)]
       
# for debugging
def printquery(statement, bind=None):
    """ 
    print a query, with values filled in
    for debugging purposes *only*
    for security, you should always separate queries from their values
    please also note that this function is quite slow
    """
    import sqlalchemy.orm
    if isinstance(statement, sqlalchemy.orm.Query):
        if bind is None:
            bind = statement.session.get_bind(
                    statement._mapper_zero_or_none()
            )   
        statement = statement.statement
    elif bind is None:
        bind = statement.bind 

    dialect = bind.dialect
    compiler = statement._compiler(dialect)
    class LiteralCompiler(compiler.__class__):
        def visit_bindparam(
                self, bindparam, within_columns_clause=False, 
                literal_binds=False, **kwargs
        ):  
            return super(LiteralCompiler, self).render_literal_bindparam(
                    bindparam, within_columns_clause=within_columns_clause,
                    literal_binds=literal_binds, **kwargs
            )   

    compiler = LiteralCompiler(dialect, statement)
    print compiler.process(statement)
