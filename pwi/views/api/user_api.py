from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_restful_swagger import swagger
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import MGIUser, VocTerm
from pwi import app, db, cache

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
# Especially important for datetime fields, which 
#    cannot be natively converted to json.
@swagger.model
class UserFields(object):
    resource_fields = {
        '_user_key': fields.Integer,
        'login': fields.String,
        'name': fields.String,
        'orcid': fields.String,
        '_usertype_key': fields.Integer,
        '_userstatus_key': fields.Integer,
        'creation_date': fields.DateTime,
        'modification_date': fields.DateTime
    }


@swagger.model
class UserListFields(object):
    resource_fields = {
        'results': fields.List(fields.Nested(UserFields.resource_fields)),  
        'total_count': fields.Integer   
    }
    
    
@swagger.model
class ChoiceFields(object):
    resource_fields = {
        'choices': fields.List(fields.Nested({
            'term': fields.String,
            '_term_key': fields.Integer
        }))
    }



def abort_if_not_exists(user, key):
    """
    raises abort if user does not exist
    """
    if not user:
        abort(404, "MGI_User._user_key %d does not exist" % key)
        
class UserListResource(Resource):
    
    
    @swagger.operation(
        responseClass=UserListFields.__name__,
        nickname="user_search",
        parameters=[{"name": "login", "dataType":"string", "paramType":"query"},
                    {"name": "name", "dataType":"string", "paramType":"query"},
                    {"name": "_usertype_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_userstatus_key", "dataType":"integer", "paramType":"query"},
                    {"name": "orcid", "dataType":"string", "paramType":"query"},
                    {"name": "_createdby_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_modifiedby_key", "dataType":"integer", "paramType":"query"}
        ]
        )
    @marshal_with(UserListFields.resource_fields)
    def get(self):
        """
        Search Users
        """
        args = search_parser.parse_args()
        
        query = MGIUser.query
        
        if args.login:
            login = args.login.lower()
            query = query.filter(db.func.lower(MGIUser.login).like(login))
            
        if args.name:
            name = args.name.lower()
            query = query.filter(db.func.lower(MGIUser.name).like(name))
            
        if args._usertype_key:
            query = query.filter(MGIUser._usertype_key==args._usertype_key)
        if args._userstatus_key:
            query = query.filter(MGIUser._userstatus_key==args._userstatus_key)
            
        if args.orcid:
            orcid = args.orcid.lower()
            query = query.filter(db.func.lower(MGIUser.orcid).like(orcid))
            
        if args._createdby_key:
            query = query.filter(MGIUser._createdby_key==args._createdby_key)
        if args._modifiedby_key:
            query = query.filter(MGIUser._modifiedby_key==args._modifiedby_key)
        
        query = query.order_by(MGIUser.login)
        users = query.all()
        return user_list_json(users)


    @swagger.operation(
        responseClass=UserFields.__name__,
        nickname="user_create",
        parameters=[{"name": "login", "dataType":"string", "required":True},
                    {"name": "name", "dataType":"string", "required":True},
                    {"name": "_usertype_key", "dataType":"integer", "required":True},
                    {"name": "_userstatus_key", "dataType":"integer", "required":True}
        ]
        )
    @marshal_with(UserFields.resource_fields)
    def post(self):
        """
        Create new user
        """
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


class UserResource(Resource):
    
    @swagger.operation(
        responseClass=UserFields.__name__,
        nickname="user_get"
        )
    @marshal_with(UserFields.resource_fields)
    def get(self, key):
        """
        Get User by key
        """
        user = MGIUser.query.filter_by(_user_key=key).first()
        abort_if_not_exists(user, key)
        return user_to_json(user)
    
    @swagger.operation(
        responseClass=UserFields.__name__,
        nickname="user_update",
        parameters=[{"name": "login", "dataType":"string", "required":True},
                    {"name": "name", "dataType":"string", "required":True},
                    {"name": "_usertype_key", "dataType":"integer", "required":True},
                    {"name": "_userstatus_key", "dataType":"integer", "required":True}
        ]
        )
    @marshal_with(UserFields.resource_fields)
    def put(self, key):
        """
        Update a user
        """
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
    
    @swagger.operation(
        responseClass=UserFields.__name__,
        nickname="user_delete"
        )
    def delete(self, key):
        """
        Delete a user
        """
        #check_permission()
        
        user = MGIUser.query.filter_by(_user_key=key).first()
        abort_if_not_exists(user, key)
        
        db.session.delete(user)
        db.session.commit()
        
        return {"success":True}
    


class UserStatusResource(Resource):
    @swagger.operation(
        responseClass=ChoiceFields.__name__,
        nickname="get_user_statuses"
        )
    @marshal_with(ChoiceFields.resource_fields)
    def get(self):
        """
        Get all user status key values
        """
        return get_user_status_choices()
    
class UserTypeResource(Resource):
    @swagger.operation(
        responseClass=ChoiceFields.__name__,
        nickname="get_user_types"
        )
    @marshal_with(ChoiceFields.resource_fields)
    def get(self):
        """
        Get all user type key values
        """
        return get_user_type_choices()
        

api.add_resource(UserStatusResource, '/user/status')
api.add_resource(UserTypeResource, '/user/type')
api.add_resource(UserListResource, '/user')
api.add_resource(UserResource, '/user/<int:key>')
    

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
        
      
@cache.cached(key_prefix='user_status_choices')  
def get_user_status_choices():
    """
    Return all user statuses
    """
    
    terms = VocTerm.query.filter_by(_vocab_key=22).all()
    json = {
        'choices':[]
    }
    for term in terms:
        json['choices'].append({'term':term.term, '_term_key':term._term_key})
    return json

@cache.cached(key_prefix='user_type_choices')  
def get_user_type_choices():
    """
    Return all user types
    """
    
    terms = VocTerm.query.filter_by(_vocab_key=23).all()
    json = {
        'choices':[]
    }
    for term in terms:
        json['choices'].append({'term':term.term, '_term_key':term._term_key})
    return json
    

