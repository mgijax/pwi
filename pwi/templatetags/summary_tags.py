from jinja2 import contextfunction,Environment,PackageLoader
env = Environment(loader=PackageLoader('pwi','templates'))
import filters
from pwi.forms.widgets import InvisibleField

def do_dynamic_summary(data,*args):
	"""
	Create a template function for generating a dynamic summary
	"""
	cols = len(args)>0 and args[0] or []	
	objectType= len(args)>1 and args[1] or ""
	linkDetail= len(args)>2 and args[2] or False
	
	if data:
		try:
			number_cols = len(data[0])
		except:
			number_cols = 0
		if not cols or len(cols)<number_cols:
			# make generic column names if not supplied
			cols = cols or []
			cols.extend(["Col %s"%(x+1) for x in range(len(cols),number_cols)])
	templateFragment = env.get_template('fragments/dynamic_summary.html')
	return templateFragment.render(data_rows=data,data_columns=cols,objectType=objectType,linkDetail=linkDetail)


def you_searched_for(form):
	"""
	Create a you search for section by 
	displaying all submitted values of the form
	"""
	data = form.data
	# valid label, value pairs
	pairs = []
	for key, value in data.items():
		if value:
			field = form._fields[key]
			if not isinstance(field, InvisibleField):
				label = field.label.text
				pairs.append([label, value])
	
	pairs.sort()
	template_fragment = env.get_template('fragments/form_search_params.html')
	return template_fragment.render(params=pairs)
	
# make the above filters available for template fragments, 
# since they are rendered separately from the app environment
env.filters["ascii_decode"] = filters.ascii_decode
env.filters["type_format"] = filters.dynamic_format