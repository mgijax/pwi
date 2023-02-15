from flask import render_template, request, Response
from flask_login import current_user
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeCount
from mgipython.util import error_template, error_json
from mgipython.error import InvalidStageInputError
from mgipython.parse import splitSemicolonInput
from mgipython.util.dag import TreeView
from mgipython.service.vocterm_service import VocTermService
from .blueprint import edit
from pwi import app, db
import json


# VocTerm service
vocterm_service = VocTermService()


# Routes

@edit.route('/emapBrowser/',methods=['GET'])   
@edit.route('/emapaBrowser/',methods=['GET'])
def emapaBrowser():
    
    return render_template( "edit/emapa/emapa_browser.html")


    
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
    
    term = vocterm_service.get_by_primary_id(id)
    
    tree_data = TreeView.buildTreeView(term)
    
    return json.dumps(tree_data)


@edit.route('/emapaTreeChildrenJson/<string:parentId>',methods=['GET'])
def emapaTreeChildrenJson(parentId):
    """
    Fetch the children JSON data for the EMAPA 
        parent with the given parentId
    """
    
    term = vocterm_service.get_by_primary_id(parentId)
    
    tree_data = TreeView.buildChildNodes(term)
    return json.dumps(tree_data)

    



