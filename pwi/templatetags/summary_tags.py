from jinja2 import contextfunction,Environment,PackageLoader
from flask import url_for
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


def paginator(routeString, paginator, form):
        """
        Create a paginator widget
        with links going to the given flask routeString
                (e.g. 'summary.resultSummary' or 'summary.specimenSummary')
                
        paginator is the flask-sqlalchemy object returned by a hunter
                (e.g. results, or specimens, etc)
        """
        
        # get form values for the paginator links
        argString = form.argString()
        
        # calculate the result numbers we are showing for this page
        startRow = ((paginator.page - 1) * paginator.per_page) + 1
        endRow = min(startRow + paginator.per_page, paginator.total)
        
        # calculate which pages we make shortcut links for
        shortcutNavs = [paginator.page]
        # middle page
        if paginator.page > 1 and paginator.page < paginator.total:
                shortcutNavs = [paginator.prev_num, paginator.page, paginator.next_num]
        elif paginator.page < paginator.total:
                # first page
                shortcutNavs.append(paginator.next_num)
                if paginator.next_num < paginator.total:
                      shortcutNavs.append(paginator.next_num + 1)  
        elif paginator.page > 1:
                # last page
                shortcutNavs.insert(0, paginator.prev_num)
                if paginator.prev_num > 1:
                        shortcutNavs.insert(0, paginator.prev_num - 1)
        
        template_fragment = env.get_template('fragments/paginator.html')
        return template_fragment.render(routeString=routeString,
                                        paginator=paginator,
                                        argString=argString,
                                        startRow=startRow,
                                        endRow=endRow,
                                        shortcutNavs=shortcutNavs)

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
env.globals.update(url_for=url_for)