from flask import render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_json import FlaskJSON, JsonError, json_response, as_json
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import Marker, MGIUser, VocTerm
from mgipython.service.marker_service import MarkerService
from pwi import app

# API Classes
api = Namespace('marker', description='Marker related operations')

# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('symbol')



@api.route('/valid', endpoint='valid-marker')
class ValidMarkerResource(Resource):
    """
    Used to query for valid marker objects by symbol
    """
    
    marker_service = MarkerService()
    
    
    @api.doc('get_valid_reference')
    @api.expect(search_parser)
    @as_json
    def get(self):
        """
        Search for valid markers
        """
        args = search_parser.parse_args()
        results = self.marker_service.get_valid_markers_by_symbol(args.symbol)
        
        return results.serialize()


