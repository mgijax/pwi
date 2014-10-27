"""
	Hacks to get flask sqlalchemy working with pyodbc and sybase 15
"""
import sqlalchemy
from sqlalchemy.dialects.sybase.base import SybaseSQLCompiler,SybaseDialect
from sqlalchemy.sql.compiler import SQLCompiler


def _get_select_precolumns(self, select):
        s = select._distinct and "DISTINCT " or ""
        return s
"""
def _visit_select(self, select, asfrom=False, parens=True,
                     iswrapper=False, fromhints=None,
                     compound_index=0,
                     force_result_map=False,
                     nested_join_translation=False,
                     **kwargs):

        needs_nested_translation = \
            select.use_labels and \
            not nested_join_translation and \
            not self.stack and \
            not self.dialect.supports_right_nested_joins

        if needs_nested_translation:
            transformed_select = self._transform_select_for_nested_joins(
                select)
            text = self.visit_select(
                transformed_select, asfrom=asfrom, parens=parens,
                iswrapper=iswrapper, fromhints=fromhints,
                compound_index=compound_index,
                force_result_map=force_result_map,
                nested_join_translation=True, **kwargs
            )

        toplevel = not self.stack
        entry = self._default_stack_entry if toplevel else self.stack[-1]

        populate_result_map = force_result_map or (
            compound_index == 0 and (
                toplevel or
                entry['iswrapper']
            )
        )

        if needs_nested_translation:
            if populate_result_map:
                self._transform_result_map_for_nested_joins(
                    select, transformed_select)
            return text

        froms = self._setup_select_stack(select, entry, asfrom, iswrapper)

        column_clause_args = kwargs.copy()
        column_clause_args.update({
            'within_label_clause': False,
            'within_columns_clause': False
        })

        text = "SELECT "  # we're off to a good start !

	# sybase 12 needs a rowcount to do limit queries
	# there is no TOP keyword
	limit = select._limit or 0
	text = "SET ROWCOUNT %d %s" % (limit, text)

        if select._hints:
            hint_text, byfrom = self._setup_select_hints(select)
            if hint_text:
                text += hint_text + " "
        else:
            byfrom = None

        if select._prefixes:
            text += self._generate_prefixes(
                select, select._prefixes, **kwargs)

        text += SQLCompiler.get_select_precolumns(select)

        # the actual list of columns to print in the SELECT column list.
        inner_columns = [
            c for c in [
                self._label_select_column(select,
                                          column,
                                          populate_result_map, asfrom,
                                          column_clause_args,
                                          name=name)
                for name, column in select._columns_plus_names
            ]
            if c is not None
        ]

        text = self._compose_select_body(
            text, select, inner_columns, froms, byfrom, kwargs)

        if select._statement_hints:
            per_dialect = [
                ht for (dialect_name, ht)
                in select._statement_hints
                if dialect_name in ('*', self.dialect.name)
            ]
            if per_dialect:
                text += " " + self.get_statement_hint_text(per_dialect)

        if self.ctes and \
                compound_index == 0 and toplevel:
            text = self._render_cte_clause() + text

        self.stack.pop(-1)

        if asfrom and parens:
            return "(" + text + ")"
        else:
            return text
"""

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

SybaseSQLCompiler.visit_select = _visit_select
SybaseSQLCompiler.get_select_precolumns = _get_select_precolumns
SybaseDialect.max_identifier_length = 30
