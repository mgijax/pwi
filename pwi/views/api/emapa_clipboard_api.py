from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_restful_swagger import swagger
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.service.emapa_clipboard_service import EMAPAClipboardService
from mgipython.error import InvalidPermissionError
from pwi import app

# API Classes

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
@swagger.model
class ClipboardEditFields(object):
    resource_fields = {
        'emapa_id': fields.String,
        'stagesToAdd': fields.String,
        'keysToDelete': fields.String,
    }
    
    
class EMAPAClipboardsResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    def get(self):
        """
        stub
        """
        
        
        return '', 200
    
    
    @marshal_with(ClipboardEditFields.resource_fields)
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
    
    
class EMAPAClipboardResource(Resource):
    
    clipboard_service = EMAPAClipboardService()
    
    
    @marshal_with(ClipboardEditFields.resource_fields)
    def put(self, key):
        """
        Add or delete clipboard items
        """
        
        pass
        return ''

        


# api.add_resource(UserStatusResource, '/user/status')
# api.add_resource(UserTypeResource, '/user/type')
# api.add_resource(UserListResource, '/user')
api.add_resource(EMAPAClipboardsResource, '/emapaClipboard')
api.add_resource(EMAPAClipboardResource, '/emapaClipboard/<int:key>')
    

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
        
    

