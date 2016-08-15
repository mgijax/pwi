from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from mgipython.util import error_template
from mgipython.model import MGIUser, VocTerm
from mgipython.service.user_service import UserService
from pwi import app

# API Classes

api = Namespace('user', description='User module operations')

# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('login')
search_parser.add_argument('name')
search_parser.add_argument('_usertype_key')
search_parser.add_argument('_userstatus_key')
search_parser.add_argument('orcid')
search_parser.add_argument('_createdby_key')
search_parser.add_argument('_modifiedby_key')


# Define how fields should be marshalled from SQLAlchemy object.
user_model = api.model('User', {
    '_user_key': fields.Integer,
    'login': fields.String,
    'name': fields.String,
    'orcid': fields.String,
    '_usertype_key': fields.Integer,
    '_userstatus_key': fields.Integer,
    'creation_date': fields.DateTime,
    'modification_date': fields.DateTime                            
})


user_search_result_model = api.model('UserSearchResult', {
    'results': fields.List(fields.Nested(user_model)),
    'total_count': fields.Integer
})
    

vocab_choice_model = api.model('VocabChoice', {
    'term': fields.String,
    '_term_key': fields.Integer
})
vocab_choices_model = api.model('VocabChoices', {
    'choices': fields.List(fields.Nested(vocab_choice_model))
})

delete_response = api.model('DeleteResponse', {
    'success': fields.Boolean
})

        
        
@api.route('/', endpoint='users-resource')
class UserListResource(Resource):
    
    user_service = UserService()
    
    
    @api.doc('search_users')
    @api.expect(search_parser)
    @api.marshal_with(user_search_result_model)
    def get(self):
        """
        Search Users
        """
        args = search_parser.parse_args()
        users = self.user_service.search(args)
        
        return user_list_json(users)


    @api.doc('save_user')
    @api.marshal_with(user_model)
    @api.expect(user_model)
    def post(self):
        """
        Create new user
        """
        #check_permission()
        
        args = request.get_json()
        app.logger.debug(args)
        app.logger.debug(dir(args))
        user = self.user_service.create(args)
        
        return user_to_json(user)


@api.route('/<int:key>', endpoint='user-resource')
@api.param('key', 'mgi_user._user_key')
class UserResource(Resource):
    
    user_service = UserService()
    
    
    @api.doc('get_user')
    @api.marshal_with(user_model)
    def get(self, key):
        """
        Get User by key
        """
        user = self.user_service.get_by_key(key)
        return user_to_json(user)
    
    
    @api.doc('update_user')
    @api.marshal_with(user_model)
    @api.expect(user_model)
    def put(self, key):
        """
        Update a user
        """
        #check_permission()
        
        args = request.get_json()
        user = self.user_service.edit(key, args)
        
        return user_to_json(user)
    
    @api.doc('delete_user')
    @api.marshal_with(delete_response)
    def delete(self, key):
        """
        Delete a user
        """
        #check_permission()
        
        self.user_service.delete(key)
        return {"success":True}
        


@api.route('/status', endpoint='user-status-resource')
class UserStatusResource(Resource):
    
    user_service = UserService()
    
    @api.doc('get_userstatus_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all user status key values
        """
        return self.user_service.get_user_status_choices()
    
@api.route('/type', endpoint='user-type-resource')
class UserTypeResource(Resource):
    
    user_service = UserService()
    
    @api.doc('get_usertype_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all user type key values
        """
        return self.user_service.get_user_type_choices()
    

# Helpers
def user_to_json (user):
    """
    retun MGIUser as json
    """
    json = {}
    for key in user.__table__.columns.keys():
        json[key] = getattr(user, key)
        
    return json


def user_list_json(users):
    """
    return list of MGIUsers as json
    """
    users_json = [user_to_json(u) for u in users]
    json = {
        "total_count": len(users),
        "results": users_json    
    }
    return json


def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    

