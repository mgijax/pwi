from jinja2 import contextfunction,Environment,PackageLoader
env = Environment(loader=PackageLoader('pwi','templates'))

# create a template function for generating a dynamic query form based on an SQLAlchemy object model
def do_dynamic_queryform(objectClass):
	cols = objectClass.__mapper__.columns
	col_forms = {}
	for colname,col in cols.items():
		if "hidden" not in dir(col) or not col.hidden:
			coltype = "textinput"
			col_forms[colname] = {"coltype":coltype}
		
	templateFragment = env.get_template('fragments/dynamic_queryform.html')
	return templateFragment.render(col_forms=col_forms)

