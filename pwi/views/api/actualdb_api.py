from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from mgipython.util import error_template
from mgipython.model import ActualDb
from mgipython.service.actualdb_service import ActualDbService
from mgipython.service_schema.search import SearchQuery
from pwi import app

# API Classes

api = Namespace('actualdb', description='ActualDB URL retrieval')

# Define the API for fields that you can search by
actualdb_parser = reqparse.RequestParser()
actualdb_parser.add_argument('_actualdb_key')

actualdb_model = api.model('ActualDb', {
    '_actualdb_key': fields.Integer                    
})

        
@api.route('/search', endpoint='actualdb-search-resource')
class ActualDbSearchResource(Resource):
    
    actualdb_service = ActualDbService()
    
    @api.doc(description="Description for ActualDB Search")
    @api.expect(actualdb_parser)
    def get(self):
        """
        Search Actual DB
        """
        args = actualdb_parser.parse_args()
        return self._perform_query(args)

    @api.expect(actualdb_model)
    def post(self):
        
        args = request.get_json()
        return self._perform_query(args)

    def _perform_query(self, args):
        search_query = SearchQuery()
        if not args:
            search_query.paginator = Paginator()
            search_query.paginator.page_size = 100

        search_query.set_params(args)

        search_result = self.actualdb_service.search(search_query)
        return search_result.serialize()
