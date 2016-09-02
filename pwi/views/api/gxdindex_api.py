from flask import request, abort, url_for
from flask_restplus import fields, inputs, Namespace, reqparse, Resource, Api
from flask_login import current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from blueprint import api
from mgipython.util import error_template
from mgipython.domain.gxdindex_domains import IndexRecordDomain, IndexStageDomain
from mgipython.model import MGIUser, VocTerm
from mgipython.service.gxdindex_service import GxdIndexService
from mgipython.service_schema.search import Paginator, SearchQuery
from pwi import app

# API Classes
api = Namespace('gxdindex', description='GXD_Index related operations')

# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('_refs_key')
search_parser.add_argument('short_citation')
search_parser.add_argument('_marker_key')
search_parser.add_argument('_priority_key')
search_parser.add_argument('_conditionalmutants_key')
search_parser.add_argument('comments')
search_parser.add_argument('fully_coded', type=inputs.boolean, help="return fully coded records")
search_parser.add_argument('_createdby_key')
search_parser.add_argument('_modifiedby_key')


# Define how fields should be marshalled from SQLAlchemy object.
# Especially important for datetime fields, which 
#    cannot be natively converted to json.

    
    
vocab_choice_model = api.model('VocabChoice', {
    'term': fields.String,
    '_term_key': fields.Integer
})
vocab_choices_model = api.model('VocabChoices', {
    'choices': fields.List(fields.Nested(vocab_choice_model))
})

delete_response = api.model('DeleteResponse', {
    'success': fields.Boolean
})


@api.route('/', endpoint='gxdindex-records-resource')
class GxdIndexCreationResource(Resource):
    
    gxdindex_service = GxdIndexService()

    @api.doc('save_gxdindex_record')
    @as_json
    def post(self):
        """
        Create new GxdIndexRecord
        """
        check_permission()
        args = request.get_json()
        gxdindex_record = self.gxdindex_service.create(args, current_user)
        
        return gxdindex_record.serialize()
    


@api.route('/<int:key>', endpoint='gxdindex-record-resource')
@api.param('key', 'gxd_index._index_key')
class GxdIndexResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_gxdindex_record')
    @as_json
    def get(self, key):
        """
        Get GxdIndexRecord by key
        """
        gxdindex_record = self.gxdindex_service.get_by_key(key)
        return gxdindex_record.serialize()
    
    @api.doc('update_gxdindex_record')
    @as_json
    def put(self, key):
        """
        Update a GxdIndexRecord
        """
        check_permission()
        
        args = request.get_json()
        gxdindex_record = self.gxdindex_service.edit(key, args, current_user)
        
        return gxdindex_record.serialize()
    
    @api.doc('delete_gxdindex_record')
    @api.marshal_with(delete_response)
    @as_json
    def delete(self, key):
        """
        Delete a GxdIndexRecord
        """
        check_permission()
        
        self.gxdindex_service.delete(key)
        return {"success":True}
        
        
        
@api.route('/search', endpoint='gxdindex-search-resource')
class GxdIndexSearchResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    
    @api.doc('search_gxdindex')
    @api.expect(search_parser)
#     @as_json
    def post(self):
        """
        Search GxdIndexRecords
        """
        args = search_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)
        
        # set a limit on the results
        paginator = Paginator()
        paginator.page_size = 2000
        search_query.paginator = paginator
        
        search_results = self.gxdindex_service.search(search_query)
        
        app.logger.debug(search_results.serialize())
        
        return search_results.serialize()


    
    
@api.route('/conditionalmutants', endpoint='gxdindex-conditionalmutants-resource')
class ConditionalMutantsValuesResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_conditionalmutants_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all conditionalmutants key values
        """
        return self.gxdindex_service.get_conditionalmutants_choices()
    
    
@api.route('/indexassay', endpoint='gxdindex-indexassay-resource')
class IndexAssayResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_indexassay_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all indexassay key values
        """
        return self.gxdindex_service.get_indexassay_choices()
    
    
@api.route('/priority', endpoint='gxdindex-priority-resource')
class IndexPriorityResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_priority_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all priority key values
        """
        return self.gxdindex_service.get_priority_choices()
    
    
@api.route('/stageid', endpoint='gxdindex-stageid-resource')
class IndexStageidResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_stageid_choices')
    @api.marshal_with(vocab_choices_model)
    def get(self):
        """
        Get all stageid key values
        """
        return self.gxdindex_service.get_stageid_choices()
    

# Helpers

def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    
