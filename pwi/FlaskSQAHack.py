"""
	Hacks to get flask sqlalchemy working with pyodbc and sybase 15
"""
import sqlalchemy
from sqlalchemy.dialects.sybase.base import SybaseSQLCompiler,SybaseDialect
from sqlalchemy.sql.compiler import SQLCompiler

MAX_SET_ROWCOUNT = "SET ROWCOUNT 10000000 "

def _get_select_precolumns(self, select):
        s = select._distinct and "DISTINCT " or ""
        return s

def _visit_select(self, select, **kwargs):
        """Look for ``LIMIT`` and OFFSET in a select statement, and if
        so tries to call set rowcount.

        """
	sybase_select = SQLCompiler.visit_select(self, select, **kwargs)
	
	# remove any previous limits
	sybase_select = sybase_select.replace(MAX_SET_ROWCOUNT, '')
	
	sybase_select = removeLowerFunctions(sybase_select)	
	sybase_select = convertUnions(sybase_select)
	
	if sybase_select.lower().startswith('select'):
	    limit = select._limit
	    if limit:
	    	sybase_select = "SET ROWCOUNT %d %s" % (limit, sybase_select) 
	    
	if not sybase_select.startswith("SET ROWCOUNT"):
		sybase_select = "%s%s" % (MAX_SET_ROWCOUNT, sybase_select) 
	
	return sybase_select


def _visit_label(self, label,
                    add_to_result_map=None,
                    within_label_clause=False,
                    within_columns_clause=False,
                    render_label_as_label=None,
                    **kw):
	"""
	Look for EXISTS clause, and if so tries to turn it into
	a CASE WHEN clause
	"""
	column_label = SQLCompiler.visit_label(self, label,
					add_to_result_map=add_to_result_map,
                    within_columns_clause=within_columns_clause,
                    render_label_as_label=render_label_as_label,
                    **kw)
	
	if column_label.lower().startswith('exists'):
		column_label = "CASE WHEN %s" % column_label
		asIndex = column_label.lower().rfind('as')
		if asIndex >= 0:
			column_label = column_label[:asIndex] + " then 1 else 0 end " + column_label[asIndex:]
			

	column_label = removeSubqueryAliases(column_label)
	column_label = removeColumnQuotes(column_label)
	
	return column_label

def removeSubqueryAliases(query):
	"""
	Aliases inside a subquery are illegal syntax in Sybase
	Since we can't prevent SQA from creating the aliases,
	we try to parse when this occurs and remove the alias.
	"""
	# make sure the set rowcount command is not active in this phase
	query = query.replace(MAX_SET_ROWCOUNT, '')
	
	openSelects = []
	open = 0
	subSelectAliases = []
	sel = 'select'
	as_ = ' as'
	for i in range(0,len(query)):
		c = query[i]
		if c == '(':
			open += 1
			
			if len(query) > (i + 1 + len(sel)) \
				and query[i + 1:(i + 1 + len(sel))].lower() == sel:
				openSelects.append(open)
		if c == ')':
			if openSelects and openSelects[-1] == open:
				openSelects.pop()
				if openSelects \
					and len(query) > (i + 1 + len(as_)) \
					and query[i + 1:(i + 1 + len(as_))].lower() == as_:
						subSelectAliases.append(i)
			open -= 1
			
	while subSelectAliases:
		startIdx = subSelectAliases.pop()
		endIdx = query.find('\n', startIdx)
		if endIdx < 0:
			endIdx = len(query)
		query = query[:startIdx + 1] + query[endIdx:]
		
	return query


def removeColumnQuotes(query):
	"""
	SQLAlchemy sometimes tries to quote columns it thinks has
	DB specific names. Sybase hates this.
	
	For now we'll just add explicit exceptions here
	"""
	query = query.replace('."date"', '.date')
	query = query.replace('."login"', '.login')
	return query


def removeLowerFunctions(query):
	"""
	Can't do function-based indices in sybase (bummer)
	which makes using lower() prohibitive
	"""
	lowIdx = query.find('lower(')
	while lowIdx >= 0:
		closeIdx = query.find(')', lowIdx)
		query = query[:lowIdx] + query[(lowIdx+6):closeIdx] + query[(closeIdx+1):]
		lowIdx = query.find('lower(')
		
	return query

def convertUnions(query):
	"""
	Sybase can't handle subquery style unions
	We must translate something like
	
	select a.col1, a.col2 from 
	(select sub1, sub2 from sq1 
		union select sub1, sub2 from sq2) a
	
	into
	
	select col1, col2 from sq1
		union select col1, col2 from sq2
	"""
	
	if 'UNION' in query:
		# get the outer query column mapping
		colMap = {}
		select_ = 'SELECT'
		from_ = 'FROM'
		
		start = query.find(select_) + len(select_)
		end = query.find(from_)
		outerCols = query[start:end].strip().split(', ')
		anonName = ''
		markerstatusReplace = None
		for col in outerCols:
			left, right = col.split(' AS ')
			leftParts = left.split('.')
			anonName = leftParts[0]
			before = leftParts[1]
			colMap[before] = right
			
			# HACK (kstone): this is a horrible, awful hack for marker summary
			if 'markerstatus' in before:
				markerstatusReplace = right
		#print colMap
			
		# remove the outer query
		queryBegin = query.find(select_, end)
		unionAlias = ') AS %s' % anonName
		queryEnd = query.find(unionAlias)
		
		orderBy = query[(queryEnd + len(unionAlias)):]
		
		
		query = query[queryBegin:queryEnd]
		
		# replace all the mapped columns
		for before, after in colMap.items():
			query = query.replace(before, after)
			orderBy = orderBy.replace(before, after)
			
		
		# replace any order by aliases
		orderBy = orderBy.replace('%s.' % anonName, '')
		if markerstatusReplace:
			orderBy = orderBy.replace('markerstatus', markerstatusReplace)
			
		query += orderBy
	
	
	return query

SybaseSQLCompiler.visit_select = _visit_select
SybaseSQLCompiler.visit_label = _visit_label
SybaseSQLCompiler.get_select_precolumns = _get_select_precolumns
SybaseDialect.max_identifier_length = 30

