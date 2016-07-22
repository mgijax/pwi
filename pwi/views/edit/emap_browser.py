from flask import render_template, request, Response
from flask_login import current_user
from blueprint import edit
from mgipython.util import error_template, error_json
from pwi import app, db
from pwi.forms import EMAPAForm, EMAPAClipboardForm
from pwi.hunter import vocterm_hunter
from pwi.hunter import emap_clipboard_hunter
from pwi.hunter import result_hunter
from pwi.error import InvalidStageInputError
from pwi.templatetags.filters import highlightEMAPA
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeCount
from mgipython.util.dag import TreeView
import json
#from mgipython.model import Foo
#from pwi.hunter import foo_hunter
#from pwi.forms import FooForm


# Routes

@edit.route('/emapBrowser',methods=['GET'])   
@edit.route('/emapaBrowser',methods=['GET'])
def emapBrowser():
    
    form = EMAPAForm(request.args)
    
    # set permissions
    # only need to be logged in to use clipboard
    can_use_clipboard = current_user.is_authenticated
    
    
    return render_template( "edit/emapa/emap_browser.html",
        can_use_clipboard=can_use_clipboard,
        form=form)
    
    
@edit.route('/emapTermResults',methods=['GET'])
def emapTermResults():
    """
    Results summary to be injected into emapBrowser page
    """

    form = EMAPAForm(request.args)
    app.logger.debug("form = %s " % form.argString())

    try:
        # perform search for terms
        terms = form.queryEMAPATerms()
    except InvalidStageInputError, e:
        return error_json(e)
    
    # prepare search tokens for highlighting
    termSearchTokens = vocterm_hunter.splitSemicolonInput(form.termSearch.data)
                
    # prepare term_highlight and synonym_highlight
    #    only set synonym_highlight if there is no highlight
    #    on the term
    batchLoadAttribute(terms, "synonyms")
    for term in terms:
        setattr(term, "term_highlight", "")
        setattr(term, "synonym_highlight", "")
        
        term.term_highlight = highlightEMAPA(term.term, termSearchTokens)
        
        # if term could not be highlighted, try synonyms
        if '<mark>' not in term.term_highlight:
            for synonym in term.synonyms:
            
                # try to highlight each synonym
                synonym_highlight = highlightEMAPA(synonym.synonym, termSearchTokens)
                
                if '<mark>' in synonym_highlight:
                    # set first synonym match and exit
                    term.synonym_highlight = synonym_highlight
                    break
        
        
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
        
    setMemberKeys = []
    for member in setMembers:
        setMemberKeys.append(member._setmember_key)
    setMemberKeysStr = ','.join(str(x) for x in setMemberKeys)
            
    return render_template( "edit/emapa/emap_clipboard.html",
        setMemberKeysStr=setMemberKeysStr,
        setMembers=setMembers)

    
@edit.route('/emapaClipboardEdit',methods=['GET'])
def emapaClipboardEdit():
    """
    Add or delete clipboard items
    """
    
    form = EMAPAClipboardForm(request.args)
    app.logger.debug("form = %s " % form.argString())

    try:
        # perform any adds or deletes to clipboard
        form.editClipboard()
    except InvalidStageInputError, e:
        return error_json(e)
    
    db.session.commit()
    
    # return success with no content
    return ('', 204) 


@edit.route('/emapaClipboardSort',methods=['GET'])
def emapaClipboardSort():
    """
    Add or delete clipboard items
    """
    
    form = EMAPAClipboardForm(request.args)
    app.logger.debug("form = %s " % form.argString())

    form.sortClipboard()
    db.session.commit()
    
    # return success with no content
    return ('', 204) 

    
    
@edit.route('/emapTermDetail/key/<int:key>',methods=['GET'])    
def emapTermDetailByKey(key):
    """
    EMAPA/S term detail to be injected into emapBrowser page
    
    NOTE: key based url primarily for SE testing
    """

    term = vocterm_hunter.getVocTermByKey(key)
    if term:
        return renderEmapaTermDetailSection(term)
    
    return 'No term found for _term_key = %d' % key
    
    
@edit.route('/emapTermDetail/<string:id>',methods=['GET'])    
def emapTermDetailById(id):  
    """
    EMAPA/S term detail to be injected into emapBrowser page
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(id)
    if term:
        return renderEmapaTermDetailSection(term)

    return 'No term found for id = %s' % id


@edit.route('/emapaTree/<string:id>',methods=['GET'])    
def testEMAPATreeView(id):  
    """
    Test EMAPA tree view for the given EMAPA id
    
    NOTE: not for public display, this is only for development/testing
    """

    return render_template( "edit/emapa/emapa_treeview.html",
            emapa_id=id)


@edit.route('/emapaTreeJson/<string:id>',methods=['GET'])
def emapaTreeJson(id):
    """
    Fetch the initial JSON data for the EMAPA 
        with the given id
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(id)
    
    tree_data = []
    
    if term:
        tree_data = TreeView.buildTreeView(term)
        
#     if term:
#         batchLoadAttributeCount([term], "results")
#         tree_data[0]["results_count"] = term.results_count
    
    return json.dumps(tree_data)


@edit.route('/emapaTreeChildrenJson/<string:parentId>',methods=['GET'])
def emapaTreeChildrenJson(parentId):
    """
    Fetch the children JSON data for the EMAPA 
        parent with the given parentId
    """
    
    term = vocterm_hunter.getVocTermByPrimaryID(parentId)
    
    tree_data = []
    
    if term:
        tree_data = TreeView.buildChildNodes(term)
    return json.dumps(tree_data)

    
####### Helper/shared functions #########

def renderEmapaTermDetailSection(term):
    
    # sort parent terms
    if term.dagnodes and term.dagnodes[0].parent_edges:
        parent_edges = term.dagnodes[0].parent_edges
        batchLoadAttribute(parent_edges, "parent_node")
        batchLoadAttribute(parent_edges, "parent_node.vocterm")
        
        parent_edges.sort(key=lambda x: (x.label, x.parent_node.vocterm.term))
        
    emapa_term = term
    
    if term.emaps_info:
        emapa_term = term.emaps_info.emapa_term
        
    # get result count for annotations link
    result_count = result_hunter.getResultCount(direct_structure_id=term.primaryid)
        
    return render_template( "edit/emapa/emapa_term_detail.html",
            term=term,
            emapa_term=emapa_term,
            term_result_count=result_count)



