from flask import render_template, abort, request, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from blueprint import api
from mgipython.util import error_template
from mgipython.service.emapa_clipboard_service import EMAPAClipboardService
from mgipython.service.vocterm_service import VocTermService
from mgipython.service_schema.search import SearchQuery
from mgipython.error import InvalidPermissionError
from pwi import app

# API Classes
api = Namespace('EMAPA', description='EMAPA Clipboard and browser operations')


search_model = api.model('EMAPASearch', {
    'termSearch': fields.String,    
    'stageSearch': fields.String                    
})

clipboard_edit_model =  api.model('ClipboardEdit', {
        'emapa_id': fields.String,
        'stagesToAdd': fields.String
    })
    
    
@api.route('/emapaClipboard', endpoint="emapa-clipboards-resource")
class EMAPAClipboardsResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    @as_json
    def get(self):
        """
        Get list of clipboard items
        """
        results = self.clipboard_service.get_clipboard_items(current_user._user_key)
        
        print results.serialize()
        
        return results.serialize()
    
    
    @api.marshal_with(clipboard_edit_model)
    def post(self):
        """
        Add clipboard items
        """
        
        args = request.get_json()
    
        check_permission()
        
        set_members = self.clipboard_service.add_items(
            current_user._user_key,
            args['emapa_id'],
            args['stagesToAdd']
        )
    
        # return success with no content
        return clipboard_list_json(set_members)
    
    @as_json
    def delete(self):
        """
        Delete all clipboard items
        """
        
        check_permission()
        
        self.clipboard_service.delete_all_items(current_user._user_key)
        
        print "DELETE ALL THE ITEMS"
        return {"success":True}
    
    
@api.route('/emapaClipboard/<int:key>', endpoint='emapa-clipboard-resource')
class EMAPAClipboardResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    @as_json
    def delete(self, key):
        """
        Delete single clipboard item
        """
        
        check_permission()
        
        self.clipboard_service.delete_item(key, current_user._user_key)
        
        return {"success":True}
    
    
@api.route('/emapaClipboard/sort', endpoint='emapa-clipboard-sort-resource')
class EmapaClipboardSortResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    @api.doc('sort_emapa_clipboard')
    def get(self):
        """
        Sort EMAPA Clipboard
        """
        check_permission()
        
        self.clipboard_service.sort_clipboard(current_user._user_key)
        
        
        return {"success":True}


@api.route('/search', endpoint='emapa-search-resource')
class EmapaSearchResource(Resource):
    
    vocterm_service = VocTermService()
    
    
    @api.doc('search_emapa')
    @api.expect(search_model)
    @as_json
    def post(self):
        """
        Search EMAPA terms
        """
        search_query = SearchQuery()
        search_query.set_params(request.get_json())
        
        search_results = self.vocterm_service.search_emapa_terms(search_query)
        
        return search_results.serialize()


@api.route('/detail/<string:id>', endpoint='emapa-detail-resource')
class EmapaDetailResource(Resource):
    
    vocterm_service = VocTermService()
    
    
    @api.doc('emapa_detail')
    @as_json
    def get(self, id):
        """
        Get EMAPA/S detail page info
        """
        emap_term = self.vocterm_service.get_emapa_term(id)
        
        return emap_term.serialize()
    
    

# Helpers
def clipboard_to_json (set_member):
    """
    retun SetMember as json
    """
    json = {}
    for key in set_member.__table__.columns.keys():
        json[key] = getattr(set_member, key)
        
    return json


def clipboard_list_json(set_members):
    """
    return list of SetMembers as json
    """
    set_members_json = [clipboard_to_json(m) for m in set_members]
    json = {
        "total_count": len(set_members),
        "results": set_members_json    
    }
    return json


def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        raise InvalidPermissionError("User not authenticated. Please login first: %s" % url_for('login'))
        
    

