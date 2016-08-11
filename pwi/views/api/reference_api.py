from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_restful_swagger import swagger
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import Reference, MGIUser, VocTerm
from mgipython.service.reference_service import ReferenceService
from pwi import app

# API Classes

# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('jnumber')


@swagger.model
class ReferenceFields(object):
    resource_fields = {
        '_refs_key': fields.Integer,
        'jnumid': fields.String,
        'citation': fields.String,
        'short_citation': fields.String
    }
    
    
        
class ValidReferenceResource(Resource):
    """
    Used to query for a valid reference object by jnumber
    """
    
    reference_service = ReferenceService()
    
    
    @swagger.operation(
        responseClass=ReferenceFields.__name__,
        nickname="reference_search",
        parameters=[{"name": "jnumber", "dataType":"string", "paramType":"query"}
        ]
        )
    @marshal_with(ReferenceFields.resource_fields)
    def get(self):
        """
        Search for a single valid reference
        """
        args = search_parser.parse_args()
        reference = self.reference_service.get_by_jnumber(args.jnumber)
        
        return reference_to_json(reference)



    

api.add_resource(ValidReferenceResource, '/reference/valid')
    

# Helpers
def reference_to_json (reference):
    """
    retun Reference as json
    """
    json = {}
    
    json['_refs_key'] = reference._refs_key
    json['jnumid'] = reference.jnumid
    json['citation'] = reference.citation
    json['short_citation'] = reference.short_citation
    
    return json




def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    

