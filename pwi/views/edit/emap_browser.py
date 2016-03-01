from flask import render_template, request, Response
from flask.ext.login import current_user
from blueprint import edit
from mgipython.util import error_template
from pwi import app
from pwi.forms import EMAPAForm
from pwi.hunter import vocterm_hunter
from pwi.hunter import emap_clipboard_hunter
from mgipython.model.query import batchLoadAttribute
from mgipython.util.dag import TreeView
import json
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
    
    # prepare search tokens for highlighting
    termSearchTokens = vocterm_hunter.splitSemicolonInput(form.termSearch.data)
                
        
    return render_template( "edit/emapa/emap_term_results.html",
        terms=terms,
        termSearchTokens=termSearchTokens)
    

@edit.route('/emapClipboard',methods=['GET'])
def emapClipboard():
    """
    Clipboard to be injected into emap browser
    """
    setMembers = []
    if current_user and current_user.is_authenticated:
        setMembers = emap_clipboard_hunter.getEmapClipboard(current_user._user_key)
            
    return render_template( "edit/emapa/emap_clipboard.html",
        setMembers=setMembers)

    
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


@edit.route('/emapaTree/<string:id>',methods=['GET'])    
def testEMAPATreeView(id):  
    """
    Test EMAPA tree view for the given EMAPA id
    
    NOTE: not for public display, this is only for development/testing
    """
    
    app.logger.debug("hiya!")

    return render_template( "edit/emapa/emapa_treeview.html",
            emapa_id=id)


@edit.route('/emapaTreeJson/<string:id>',methods=['GET'])
def emapaTreeJson(id):
    """
    Fetch the initial JSON data for the EMAPA 
        with the given id
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(id)
    
    tree_data = TreeView.buildTreeView(term)
    
    return json.dumps(tree_data)


@edit.route('/emapaTreeChildrenJson/<string:parentId>',methods=['GET'])
def emapaTreeChildrenJson(parentId):
    """
    Fetch the children JSON data for the EMAPA 
        parent with the given parentId
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(parentId)
    
    tree_data = TreeView.buildChildNodes(term)
    return json.dumps(tree_data)
    
    
####### Helper/shared functions #########

def renderEmapaTermDetailSection(term):
    
    # sort parent terms
    if term.dagnodes and term.dagnodes[0].parent_edges:
        parent_edges = term.dagnodes[0].parent_edges
        batchLoadAttribute(parent_edges, "parent_node.vocterm")
        
        parent_edges.sort(key=lambda x: (x.label, x.parent_node.vocterm.term))
        
    return render_template( "edit/emapa/emapa_term_detail.html",
            term=term)



