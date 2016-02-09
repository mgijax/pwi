from flask import render_template, request, Response
from blueprint import edit
from mgipython.util import error_template
#from mgipython.model import Foo
#from pwi.hunter import foo_hunter
#from pwi.forms import FooForm


# Routes
    
@edit.route('/emapBrowser',methods=['GET'])
def emapBrowser():
    
    # get form params
    #form = FooForm(request.args)

    
    return render_template( "edit/emap_browser.html" )
#    return render_template("edit/emap_browser.html",
#                           queryString=form.argString() )
    
    
    
