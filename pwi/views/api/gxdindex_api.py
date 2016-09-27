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


# Define how fields should be parsed for incoming requests
#   This should match the domain objects used

indexstage_model = api.model('IndexStage', {
    '_indexassay_key': fields.Integer,
    '_stageid_key': fields.Integer
})

gxdindex_model = api.model('GxdIndexRecord', {
    '_index_key': fields.Integer,
    '_refs_key': fields.Integer,
    '_marker_key': fields.Integer,
    '_priority_key': fields.Integer,
    '_conditionalmutants_key': fields.Integer,
    'comments': fields.String,
    
    'indexstages': fields.List(fields.Nested(indexstage_model)),
    
    # readonly fields
    'is_coded': fields.Boolean,
    'jnumid': fields.String,
    'marker_symbol': fields.String,
    '_createdby_key': fields.Integer,
    '_modifiedby_key': fields.Integer,
    'creation_date': fields.DateTime,
    'modification_date': fields.DateTime
})


@api.route('', endpoint='gxdindex-records-resource')
class GxdIndexCreationResource(Resource):
    
    gxdindex_service = GxdIndexService()

    @api.doc('save_gxdindex_record')
    @api.expect(gxdindex_model)
    @as_json
    def post(self):
        """
        Create new GxdIndexRecord
        """
        check_permission()
        indexrecord = IndexRecordDomain()
        indexrecord.load_from_dict(request.json)
        gxdindex_record = self.gxdindex_service.create(indexrecord, current_user)
        
        return gxdindex_record.serialize()
    


@api.route('/<int:key>', endpoint='gxdindex-record-resource')
@api.param('key', 'gxd_index._index_key')
class GxdIndexResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @api.doc('get_gxdindex_record')
    @api.expect(gxdindex_model)
    @as_json
    def get(self, key):
        """
        Get GxdIndexRecord by key
        """
        gxdindex_record = self.gxdindex_service.get_by_key(key)
        return gxdindex_record.serialize()
    
    
    @api.doc('update_gxdindex_record')
    @api.expect(gxdindex_model)
    @as_json
    def put(self, key):
        """
        Update a GxdIndexRecord
        """
        check_permission()
        
        indexrecord = IndexRecordDomain()
        indexrecord.load_from_dict(request.json)
        gxdindex_record = self.gxdindex_service.update(key, indexrecord, current_user)
        
        return gxdindex_record.serialize()
    
    @api.doc('delete_gxdindex_record')
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
    @api.expect(gxdindex_model)
    @as_json
    def post(self):
        """
        Search GxdIndexRecords
        """
        search_query = SearchQuery()
        search_query.set_params(request.json)
        
        # set a limit on the results
        paginator = Paginator()
        paginator.page_size = 2000
        search_query.paginator = paginator
        
        search_results = self.gxdindex_service.search(search_query)
        
        app.logger.debug(search_results.serialize())
        
        return search_results.serialize()
    
    
@api.route('/count', endpoint='gxdindex-count-resource')
class GxdIndexCountResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    
    @api.doc('count_gxdindex')
    @as_json
    def get(self):
        """
        Get total count of GxdIndexRecords
        """
        total_count = self.gxdindex_service.get_total_count()
        
        return { "total_count": total_count}



# Helpers

def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    
