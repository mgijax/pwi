from flask import request, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from mgipython.util import error_template
from mgipython.model import MGIType
from mgipython.service.mgitype_service import MGITypeService
from mgipython.service_schema.search import SearchQuery
from pwi import app

# API Classes

api = Namespace('mgitype', description='MGI Type module operations')

# Define the API for fields that you can search by
mgitype_parser = reqparse.RequestParser()
mgitype_parser.add_argument('_mgitype_key')
mgitype_parser.add_argument('name')
mgitype_parser.add_argument('creation_date')
mgitype_parser.add_argument('modification_date')

mgitype_model = api.model('MGIType', {
    '_mgitype_key': fields.Integer,
    'name': fields.String,
    'creation_date': fields.DateTime,
    'modification_date': fields.DateTime                            
})

        
@api.route('/search', endpoint='mgitype-search-resource')
class MGITypeSearchResource(Resource):
    
    mgitype_service = MGITypeService()
    
    @api.doc(description="Description for MGI Type Search")
    @api.expect(mgitype_parser)
    def get(self):
        """
        Search MGIType
        """
        args = mgitype_parser.parse_args()
        return self._perform_query(args)

    @api.expect(mgitype_model)
    def post(self):
        
        args = request.get_json()
        return self._perform_query(args)

    def _perform_query(self, args):
        search_query = SearchQuery()
        if not args:
            search_query.paginator = Paginator()
            search_query.paginator.page_size = 100

        search_query.set_params(args)

        search_result = self.mgitype_service.search(search_query)
        return search_result.serialize()
