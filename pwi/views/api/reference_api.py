from flask import render_template, abort, url_for, request
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import Reference, MGIUser, VocTerm
from mgipython.service.reference_service import ReferenceService
from pwi import app

# API Classes
api = Namespace('reference', description='Reference API operations')

###--- validate an individual J: number ---###

# Define the API for fields that you can use to validate a J: number
valid_jnum_parser = reqparse.RequestParser()
valid_jnum_parser.add_argument('jnumber', type=str, help='J: number for which to retrieve citation and database key')

# accessed as:  http://.../pwi/api/reference/valid?jnumber=J:80000
@api.route('/valid', endpoint='valid-reference')
class ValidReferenceResource(Resource):
    """
    Used to query for a valid reference object by jnumber
    """
    
    reference_service = ReferenceService()
    
    
    @api.doc('get_valid_reference')
    @api.expect(valid_jnum_parser)
    def get(self):
        """
        Search for a single valid reference
        """
        args = valid_jnum_parser.parse_args()
        reference = self.reference_service.get_by_jnumber(args.jnumber)
        
        return reference.serialize()
