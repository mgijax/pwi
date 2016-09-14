from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_json import FlaskJSON, JsonError, json_response, as_json
from mgipython.util import error_template
from mgipython.model import MGIUser, VocTerm
from mgipython.service.user_service import UserService
from mgipython.service_schema.search import SearchQuery
from pwi import app

# API Classes

api = Namespace('user', description='User module operations')

# Define the API for fields that you can search by
user_parser = reqparse.RequestParser()
user_parser.add_argument('login')
user_parser.add_argument('name')
user_parser.add_argument('_usertype_key')
user_parser.add_argument('_userstatus_key')
user_parser.add_argument('orcid')
user_parser.add_argument('_createdby_key')
user_parser.add_argument('_modifiedby_key')


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


@api.route('/', endpoint='users-resource')
class UserListResource(Resource):
    
    user_service = UserService()
    
    @api.doc('search_users')
    @api.expect(user_parser)
    @as_json
    def get(self):
        """
        Search Users
        """
        args = user_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)
        
        search_results = self.user_service.search(search_query)
        
        return search_results.serialize()


    @api.expect(user_model)
    @as_json
    def post(self):
        """
        Create new user
        """
        
        args = request.get_json()
        app.logger.debug(args)
        app.logger.debug(dir(args))
        user = self.user_service.create(args)
        
        return user.serialize()


@api.route('/<int:key>', endpoint='user-resource')
@api.param('key', 'mgi_user._user_key')
class UserResource(Resource):
    
    user_service = UserService()
    
   
    @api.expect(user_model)
    @as_json
    def put(self, key):
        """
        Update a user
        """
        
        args = request.get_json()
        user = self.user_service.edit(key, args)
        
        return user.serialize()

    @as_json
    def get(self, key):
        """
        Get User by key
        """
        user = self.user_service.get_by_key(key)
        return user.serialize()
    
    @as_json
    def delete(self, key):
        """
        Delete a user
        """
        user = self.user_service.delete(key)
        return user.serialize()
        
@api.route('/loggedin', endpoint='user-logged-in-resource')
class UserLoggedInResource(Resource):
    user_service = UserService()

    @as_json
    def get(self):
        """
        Get Logged In User
        """
        user = self.user_service.current_user()
        return user.serialize()
