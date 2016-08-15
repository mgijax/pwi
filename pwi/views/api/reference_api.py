from flask import render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import Reference, MGIUser, VocTerm
from mgipython.service.reference_service import ReferenceService
from pwi import app

# API Classes
api = Namespace('reference', description='Reference related operations')

# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('jnumber')



reference_model = api.model('Reference', {
    '_refs_key': fields.Integer,
    'jnumid': fields.String,
    'citation': fields.String,
    'short_citation': fields.String
 })
    
    

@api.route('/valid', endpoint='valid-reference')
class ValidReferenceResource(Resource):
    """
    Used to query for a valid reference object by jnumber
    """
    
    reference_service = ReferenceService()
    
    
    @api.doc('get_valid_reference')
    @api.expect(search_parser)
    @api.marshal_with(reference_model)
    def get(self):
        """
        Search for a single valid reference
        """
        args = search_parser.parse_args()
        reference = self.reference_service.get_by_jnumber(args.jnumber)
        
        return reference_to_json(reference)


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
        
    

