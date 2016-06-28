from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import MGIUser
from pwi import app, db

# API Classes

# Define the API for fields that need to be set for saving/updating records
post_parser = reqparse.RequestParser()
post_parser.add_argument(
    'login', 
    required=True, help='The user\'s login',
)
post_parser.add_argument(
    'name',
    required=True, help='The user\'s name',
)
post_parser.add_argument(
    '_usertype_key',
    type=int,
    required=True, help='_term_key for user type, _vocab_key=23',
)
post_parser.add_argument(
    '_userstatus_key',
    type=int, 
    required=True, help='_term_key for user status, _vocab_key=22',
)
post_parser.add_argument('orcid')


# Define how fields should be marshalled from SQLAlchemy object.
# Especially important for datetime fields, which 
#    cannot be natively converted to json.
user_fields = {
    '_user_key': fields.Integer,
    'login': fields.String,
    'name': fields.String,
    'orcid': fields.String,
    '_usertype_key': fields.Integer,
    '_userstatus_key': fields.Integer,
    'creation_date': fields.DateTime,
    'modification_date': fields.DateTime
}



def abort_if_not_exists(user, key):
    """
    raises abort if user does not exist
    """
    if not user:
        abort(404, "MGI_User._user_key %d does not exist" % key)

class UserResource(Resource):
    
    @marshal_with(user_fields)
    def get(self, key):
        user = MGIUser.query.filter_by(_user_key=key).first()
        abort_if_not_exists(user, key)
        return user_to_json(user)
    
    @marshal_with(user_fields)
    def put(self, key):
        #check_permission()
        
        user = MGIUser.query.filter_by(_user_key=key).first()
        abort_if_not_exists(user, key)
        
        args = post_parser.parse_args()
        user.login = args.login
        user.name = args.name
        user._usertype_key = args._usertype_key
        user._userstatus_key = args._userstatus_key
        #user._modifiedby_key = current_user._modifiedby_key
        
        db.session.commit()
        
        return user_to_json(user)
    
    def delete(self, key):
        #check_permission()
        
        user = MGIUser.query.filter_by(_user_key=key).first()
        abort_if_not_exists(user, key)
        
        db.session.delete(user)
        db.session.commit()
        
        return {"success":True}
    
    @marshal_with(user_fields)
    def post(self):
        #check_permission()
        
        args = post_parser.parse_args()
        user = MGIUser()
        nextKey = db.session.query(db.func.max(MGIUser._user_key).label("max_key")) \
                .one().max_key + 1
        user._user_key = nextKey
        user.login = args.login
        user.name = args.name
        user._usertype_key = args._usertype_key
        user._userstatus_key = args._userstatus_key
        
        #user._createdby_key = current_user._user_key
        #user._modifiedby_key = current_user._modifiedby_key
        
        db.session.add(user)
        db.session.commit()
        
        return user_to_json(user)


api.add_resource(UserResource, '/user', '/user/<int:key>')
    

# Helpers
def user_to_json (user):
    """
    retun MGIUser as json
    """
    json = {}
    for key in user.__table__.columns.keys():
        json[key] = getattr(user, key)
        
    return json


def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
    
    

