from flask import render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.service.emapa_clipboard_service import EMAPAClipboardService
from mgipython.error import InvalidPermissionError
from pwi import app

# API Classes
api = Namespace('EMAPA', description='EMAPA Clipboard and browser operations')

# Define the API for fields that need to be set for editting the clipboard
put_parser = reqparse.RequestParser()
put_parser.add_argument(
    'emapaId', 
    help='EMAPA ID to add',
)
put_parser.add_argument(
    'stagesToAdd',
    help='which stages of emapaId to add',
)
put_parser.add_argument(
    'keysToDelete',
    help='which _setmember_keys to delete',
)

# Define how fields should be marshalled from SQLAlchemy object.
# Especially important for datetime fields, which 
#    cannot be natively converted to json.
clipboard_edit_model =  api.model('ClipboardEdit', {
        'emapa_id': fields.String,
        'stagesToAdd': fields.String,
        'keysToDelete': fields.String,
    })
    
    
@api.route('/emapaClipboard', endpoint="emapa-clipboards-resource")
class EMAPAClipboardsResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    def get(self):
        """
        stub
        """
        
        
        return '', 200
    
    
    @api.marshal_with(clipboard_edit_model)
    def put(self):
        """
        Add or delete clipboard items
        """
        
        args = put_parser.parse_args()
    
        check_permission()
        
        set_members = self.clipboard_service.edit_clipboard(
            current_user,
            args
        )
    
        # return success with no content
        return clipboard_list_json(set_members)
    
    
@api.route('/emapaClipboard/<int:key>', endpoint='emapa-clipboard-resource')
class EMAPAClipboardResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    @api.marshal_with(clipboard_edit_model)
    def put(self, key):
        """
        Add or delete clipboard items
        """
        
        pass
        return ''

    

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
        
    

