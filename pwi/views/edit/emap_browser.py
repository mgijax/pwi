from flask import render_template, request, Response
from blueprint import edit
from mgipython.util import error_template
from pwi import app
from pwi.forms import EMAPAForm
from pwi.hunter import vocterm_hunter
from mgipython.model.query import batchLoadAttribute
#from mgipython.model import Foo
#from pwi.hunter import foo_hunter
#from pwi.forms import FooForm


# Routes
    
@edit.route('/emapBrowser',methods=['GET'])
def emapBrowser():
    
    # pass termSearch forward if one is submitted
    termSearch = ''
    params = EMAPAForm(request.args)._getParams()
    if params:
        if 'termSearch' in params:
            termSearch = params['termSearch']
    
    return render_template( "edit/emapa/emap_browser.html",
        termSearch=termSearch)
    
    
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
    
    # sort parent terms
    if term.dagnodes and term.dagnodes[0].parent_edges:
        parent_edges = term.dagnodes[0].parent_edges
        batchLoadAttribute(parent_edges, "parent_node.vocterm")
        
        parent_edges.sort(key=lambda x: (x.label, x.parent_node.vocterm.term))
        
    return render_template( "edit/emapa/emapa_term_detail.html",
            term=term)


