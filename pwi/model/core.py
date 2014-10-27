"""
	Contains core functions and classes for working with SQL Alchemy
"""
from pwi import db,app

class MGIModel:
        if app.config["DBTYPE"] == "Postgres":
                __table_args__ = {"schema":"mgd"}
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

