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



@api.route('/valid', endpoint='valid-reference')
class ValidReferenceResource(Resource):
    """
    Used to query for a valid reference object by jnumber
    """
    
    reference_service = ReferenceService()
    
    
    @api.doc('get_valid_reference')
    @api.expect(search_parser)
    def get(self):
        """
        Search for a single valid reference
        """
        args = search_parser.parse_args()
        reference = self.reference_service.get_by_jnumber(args.jnumber)
        json_refs = Reference.serialize_list([reference])
        
        
        return json_refs[0]


