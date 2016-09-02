from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from mgipython.util import error_template
from mgipython.model import VocTerm
from mgipython.service.vocterm_service import VocTermService
from mgipython.service_schema.search import SearchQuery
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
        dict = {}
        dict["items"] = VocTerm.serialize_list(search_result.items)
        if search_query.paginator:
            dict["paginator"] = { "page_num":search_result.paginator.page_num, "page_size":search_result.paginator.page_size}
        dict["total_count"] = search_result.total_count
        return dict


