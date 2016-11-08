from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from mgipython.util import error_template
from mgipython.model import *
from mgipython.service import *
from mgipython.service_schema import *
from pwi import app

# API Classes

api = Namespace('vocterm', description='VocTerm module operations')

# Define the API for fields that you can search by
vocterm_parser = reqparse.RequestParser()
vocterm_parser.add_argument('_term_key')
vocterm_parser.add_argument('_vocab_key')
vocterm_parser.add_argument('vocab_name')
vocterm_parser.add_argument('id')
vocterm_parser.add_argument('creation_date')
vocterm_parser.add_argument('modification_date')

vocterm_model = api.model('VocTerm', {
    '_term_key': fields.Integer,
    '_vocab_key': fields.Integer,
    'vocab_name': fields.String,
    'id': fields.String,
    'creation_date': fields.DateTime,
    'modification_date': fields.DateTime                            
})

voctermemaps_parser = reqparse.RequestParser()
voctermemaps_parser.add_argument('emapsid')
voctermemaps_parser.add_argument('_term_key')
voctermemaps_parser.add_argument('_emapa_term_key')
voctermemaps_parser.add_argument('_stage_key')

voctermemaps_model = api.model('VocTermEMAPS', {
    'emapsid': fields.String,
    '_term_key': fields.Integer,
    '_emapa_term_key': fields.Integer,
    '_stage_key': fields.Integer,
})

        
@api.route('/search', endpoint='vocterm-search-resource')
class VocTermSearchResource(Resource):
    
    vocterm_service = VocTermService()
    
    @api.doc(description="Description for VocTerm Search")
    @api.expect(vocterm_parser)
    def get(self):
        """
        Search VocTerm
        """
        args = vocterm_parser.parse_args()
        return self._perform_query(args)

    @api.expect(vocterm_model)
    def post(self):
        
        args = request.get_json()
        return self._perform_query(args)

    def _perform_query(self, args):
        search_query = SearchQuery()
        if not args:
            search_query.paginator = Paginator()
            search_query.paginator.page_size = 100

        search_query.set_params(args)

        search_result = self.vocterm_service.search(search_query)
        return search_result.serialize()

@api.route('/emaps/search', endpoint='vocterm-emaps-search-resource')
class VocTermSearchResource(Resource):

    vocterm_service = VocTermService()

    @api.doc(description="Description for VocTermEMAPS Search")
    @api.expect(voctermemaps_parser)
    def get(self):
        args = voctermemaps_parser.parse_args()
        return self._perform_query(args)

    @api.expect(voctermemaps_model)
    def post(self):
        args = request.get_json()
        return self._perform_query(args)

    def _perform_query(self, args):
        search_query = SearchQuery()
        hasvalues = False
        for key in args:
            if(args[key] != None):
                hasvalues = True

        if hasvalues:
            search_query.set_params(args)
            search_result = self.vocterm_service.search_emaps_terms(search_query)
            return search_result.serialize()
        else:
            return SearchResults().serialize()

