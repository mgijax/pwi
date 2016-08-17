from flask import request, abort, url_for
from flask_restplus import fields, inputs, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdIndexRecord, GxdIndexStage, MGIUser, VocTerm
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
search_parser.add_argument('is_coded', type=inputs.boolean, help="return fully coded records")
search_parser.add_argument('_createdby_key')
search_parser.add_argument('_modifiedby_key')


# Define how fields should be marshalled from SQLAlchemy object.
# Especially important for datetime fields, which 
#    cannot be natively converted to json.

index_stage_model = api.model('IndexStage', {
    'indexassay': fields.String,
    'stageid': fields.String
})


index_record_model = api.model('GxdIndexRecord', {
    '_refs_key': fields.Integer,
    '_marker_key': fields.Integer,
    '_priority_key': fields.Integer,
    '_conditionalmutants_key': fields.Integer,
    'comments': fields.String,
    '_createdby_key': fields.Integer,
    '_modifiedby_key': fields.Integer,
    'creation_date': fields.DateTime,
    'createdby_login': fields.String,
    'modification_date': fields.DateTime,
    'modifiedby_login': fields.String,
    'indexstages': fields.List(fields.Nested(index_stage_model)),
    
    # readonly
    'jnumid': fields.String,
    'ref_citation': fields.String,
    'marker_symbol': fields.String
})


index_search_result_model = api.model('IndexSearchResult',{
    '_index_key': fields.Integer,
    'jnum_id': fields.String,
    'short_citation': fields.String,
    'marker_symbol': fields.String
})


index_search_results_model = api.model('IndexSearchResults', {
    'results': fields.List(fields.Nested(index_search_result_model)),  
    'total_count': fields.Integer   
})
    
    
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
class GxdIndexListResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    
    @api.doc('search_gxdindex')
    @api.expect(search_parser)
    @api.marshal_with(index_search_results_model)
    def get(self):
        """
        Search GxdIndexRecords
        """
        args = search_parser.parse_args()
        app.logger.debug('args = %s' % args)
        search_query = SearchQuery()
        search_query.set_params(args)
        
        # set a limit on the results
        paginator = Paginator()
        paginator.page_size = 2000
        search_query.paginator = paginator
        
        search_results = self.gxdindex_service.search(search_query)
        
        return search_results_json(search_results)


    @api.doc('save_gxdindex_record')
    @api.expect(index_record_model)
    @api.marshal_with(index_record_model)
    def post(self):
        """
        Create new GxdIndexRecord
        """
        check_permission()
        raise Exception("Not implemented")
        args = request.get_json()
        gxdindex_record = self.gxdindex_service.create(args, current_user)
        
        return record_to_json(gxdindex_record)


@api.route('/<int:key>', endpoint='gxdindex-record-resource')
@api.param('key', 'gxd_index._index_key')
class GxdIndexResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_gxdindex_record')
    @api.marshal_with(index_record_model)
    def get(self, key):
        """
        Get GxdIndexRecord by key
        """
        gxdindex_record = self.gxdindex_service.get_by_key(key)
        return record_to_json(gxdindex_record)
    
    @api.doc('update_gxdindex_record')
    @api.expect(index_record_model)
    @api.marshal_with(index_record_model)
    def put(self, key):
        """
        Update a GxdIndexRecord
        """
        check_permission()
        
        args = request.get_json()
        gxdindex_record = self.gxdindex_service.edit(key, args)
        
        return record_to_json(gxdindex_record)
    
    @api.doc('delete_gxdindex_record')
    @api.marshal_with(delete_response)
    def delete(self, key):
        """
        Delete a GxdIndexRecord
        """
        check_permission()
        
        self.gxdindex_service.delete(key)
        return {"success":True}
        

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
    

# Helpers
def record_to_json (gxdindex_record):
    """
    retun single GxdIndexRecord as json
    """
    json = {}
    for key in gxdindex_record.__table__.columns.keys():
        json[key] = getattr(gxdindex_record, key)
        
    json['indexstages'] = gxdindex_record.indexstages
    json['createdby_login'] = gxdindex_record.createdby.login
    json['modifiedby_login'] = gxdindex_record.modifiedby.login
    
    # add readonly attributes
    json['jnumid'] = gxdindex_record.reference.jnumid
    json['ref_citation'] = gxdindex_record.reference.short_citation
    json['marker_symbol'] = gxdindex_record.marker.symbol
    
    return json


def result_record_to_json(gxdindex_record):
    """
    return GxdIndexRecord as json
    for the results summary
    """
    json = {}
    
    # add readonly attributes
    json['_index_key'] = gxdindex_record._index_key
    json['jnum_id'] = gxdindex_record.reference.jnumid
    json['short_citation'] = gxdindex_record.reference.short_citation
    json['marker_symbol'] = gxdindex_record.marker.symbol
    
    return json

def search_results_json(search_results):
    """
    return list of GxdIndexRecords as json
    """
    results_json = [result_record_to_json(record) for record in search_results.items]
    json = {
        "total_count": search_results.total_count,
        "results": results_json    
    }
    return json


def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    

