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
from pwi.hunter import result_hunter
import json


# VocTerm service
vocterm_service = VocTermService()


# Routes

@edit.route('/celltypeBrowser/',methods=['GET'])
def celltypeBrowser():

    return render_template( "edit/celltype/celltype_browser.html")


@edit.route('/celltypeTreeJson/<string:id>',methods=['GET'])
def celltypeTreeJson(id):
    """
    Fetch the initial JSON data for the Cell Type
        with the given id
    """
    
    term = vocterm_service.get_by_primary_id(id)
    
    tree_data = TreeView.buildTreeView(term)
    
    return json.dumps(tree_data)


@edit.route('/celltypeTreeChildrenJson/<string:parentId>',methods=['GET'])
def celltypeTreeChildrenJson(parentId):
    """
    Fetch the children JSON data for the Cell Type
        parent with the given parentId
    """
    
    term = vocterm_service.get_by_primary_id(parentId)
    
    tree_data = TreeView.buildChildNodes(term)
    return json.dumps(tree_data)

