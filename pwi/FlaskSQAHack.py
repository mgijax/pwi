"""
	Hacks to get flask sqlalchemy working with pyodbc and sybase 15
"""
import sqlalchemy
from sqlalchemy.dialects.sybase.base import SybaseSQLCompiler,SybaseDialect
from sqlalchemy.sql.compiler import SQLCompiler


def _get_select_precolumns(self, select):
        s = select._distinct and "DISTINCT " or ""
        return s

def _visit_select(self, select, **kwargs):
        """Look for ``LIMIT`` and OFFSET in a select statement, and if
        so tries to call set rowcount.

        """
	sybase_select = SQLCompiler.visit_select(self, select, **kwargs)
	if sybase_select.lower().startswith('select'):
	    limit = select._limit
	    if limit:
		sybase_select = "SET ROWCOUNT %d %s" % (limit, sybase_select) 
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
	return column_label

SybaseSQLCompiler.visit_select = _visit_select
SybaseSQLCompiler.visit_label = _visit_label
SybaseSQLCompiler.get_select_precolumns = _get_select_precolumns
SybaseDialect.max_identifier_length = 30

