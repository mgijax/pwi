from flask import render_template, request, Response
from blueprint import edit
from mgipython.util import error_template
from pwi import app
from pwi.forms import EMAPAForm
from pwi.hunter import vocterm_hunter
#from mgipython.model import Foo
#from pwi.hunter import foo_hunter
#from pwi.forms import FooForm


# Routes
    
@edit.route('/emapBrowser',methods=['GET'])
def emapBrowser():
    
    # get form params
    #form = FooForm(request.args)

    
    return render_template( "edit/emapa/emap_browser.html" )
#    return render_template("edit/emap_browser.html",
#                           queryString=form.argString() )
    
    
@edit.route('/emapTermResults',methods=['GET'])
def emapTermResults():
    """
    Results summary to be injected into emapBrowser page
    """

    form = EMAPAForm(request.args)

    app.logger.debug("form = %s " % form.argString())

    terms = form.queryEMAPATerms()
        
    return render_template( "edit/emapa/emap_term_results.html",
        terms=terms)
    
    
@edit.route('/emapTermDetail/key/<int:key>',methods=['GET'])    
def emapTermDetailByKey(key):
    """
    EMAPA/S term detail to be injected into emapBrowser page
    
    NOTE: key based url primarily for SE testing
    """

    term = vocterm_hunter.getVocTermByKey(key)
    if term:
        return renderEmapaTermDetailSection(term)
    
    return error_template('No term found for _term_key = %d' % key)
    
    
@edit.route('/emapTermDetail/<string:id>',methods=['GET'])    
def emapTermDetailById(id):  
    """
    EMAPA/S term detail to be injected into emapBrowser page
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(id)
    if term:
        return renderEmapaTermDetailSection(term)

    return error_template('No term found for id = %s' % id)

    
def renderEmapaTermDetailSection(term):
    
    return render_template( "edit/emapa/emapa_term_detail.html",
            term=term)


