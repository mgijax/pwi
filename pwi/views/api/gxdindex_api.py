from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_restful_swagger import swagger
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdIndexRecord, GxdIndexStage, MGIUser, VocTerm
from mgipython.service.gxdindex_service import GxdIndexService
from pwi import app

# API Classes

# Define the API for fields that need to be set for saving/updating records
# post_parser = reqparse.RequestParser()
# post_parser.add_argument(
#     'login', 
#     required=True, help='The user\'s login',
# )
# post_parser.add_argument(
#     'name',
#     required=True, help='The user\'s name',
# )
# post_parser.add_argument(
#     '_usertype_key',
#     type=int,
#     required=True, help='_term_key for user type, _vocab_key=23',
# )
# post_parser.add_argument(
#     '_userstatus_key',
#     type=int, 
#     required=True, help='_term_key for user status, _vocab_key=22',
# )
# post_parser.add_argument('orcid')


# Define the API for fields that you can search by
search_parser = reqparse.RequestParser()
search_parser.add_argument('_refs_key')
search_parser.add_argument('_marker_key')
search_parser.add_argument('_priority_key')
search_parser.add_argument('_conditionalmutants_key')
search_parser.add_argument('comments')
search_parser.add_argument('_createdby_key')
search_parser.add_argument('_modifiedby_key')


# Define how fields should be marshalled from SQLAlchemy object.
# Especially important for datetime fields, which 
#    cannot be natively converted to json.
@swagger.model
class GxdIndexRecordFields(object):
    resource_fields = {
        '_refs_key': fields.Integer,
        '_marker_key': fields.Integer,
        '_priority_key': fields.Integer,
        '_conditionalmutants_key': fields.Integer,
        'comments': fields.String,
        '_createdby_key': fields.Integer,
        '_modifiedby_key': fields.Integer,
        'creation_date': fields.DateTime,
        'modification_date': fields.DateTime,
        
        # readonly
        'jnumid': fields.String,
        'ref_citation': fields.String,
        'marker_symbol': fields.String
    }


@swagger.model
class GxdIndexResultFields(object):
    """
    Fields for the search results
    """
    resource_fields = {
        '_index_key': fields.Integer,
        'jnum_id': fields.String,
        'short_citation': fields.String,
        'marker_symbol': fields.String
    }

@swagger.model
class GxdIndexResultListFields(object):
    """
    List wrapper for search results
    """
    resource_fields = {
        'results': fields.List(fields.Nested(GxdIndexResultFields.resource_fields)),  
        'total_count': fields.Integer   
    }
    
    
@swagger.model
class ChoiceFields(object):
    resource_fields = {
        'choices': fields.List(fields.Nested({
            'term': fields.String,
            '_term_key': fields.Integer
        }))
    }


        
class GxdIndexListResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    
    @swagger.operation(
        responseClass=GxdIndexResultListFields.__name__,
        nickname="gxdindex_search",
        parameters=[{"name": "_refs_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_marker_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_priority_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_conditionalmutants_key", "dataType":"integer", "paramType":"query"},
                    {"name": "comments", "dataType":"string", "paramType":"query"},
                    {"name": "_createdby_key", "dataType":"integer", "paramType":"query"},
                    {"name": "_modifiedby_key", "dataType":"integer", "paramType":"query"}
        ]
        )
    @marshal_with(GxdIndexResultListFields.resource_fields)
    def get(self):
        """
        Search GxdIndexRecords
        """
        args = search_parser.parse_args()
        gxdindex_records = self.gxdindex_service.search(args)
        
        return results_list_json(gxdindex_records)


    @swagger.operation(
        responseClass=GxdIndexRecordFields.__name__,
        nickname="gxdindex_create",
        )
    @marshal_with(GxdIndexRecordFields.resource_fields)
    def post(self):
        """
        Create new GxdIndexRecord
        """
        check_permission()
        raise Exception("Not implemented")
        args = post_parser.parse_args()
        gxdindex_record = self.gxdindex_service.create(args, current_user)
        
        return record_to_json(gxdindex_record)


class GxdIndexResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @swagger.operation(
        responseClass=GxdIndexRecordFields.__name__,
        nickname="gxdindex_get"
        )
    @marshal_with(GxdIndexRecordFields.resource_fields)
    def get(self, key):
        """
        Get GxdIndexRecord by key
        """
        gxdindex_record = self.gxdindex_service.get_by_key(key)
        return record_to_json(gxdindex_record)
    
    @swagger.operation(
        responseClass=GxdIndexRecordFields.__name__,
        nickname="gxdindex_update"
        )
    @marshal_with(GxdIndexRecordFields.resource_fields)
    def put(self, key):
        """
        Update a GxdIndexRecord
        """
        check_permission()
        
        gxdindex_record = self.gxdindex_service.get_by_key(key)
        
        args = post_parser.parse_args()
        gxdindex_record = self.gxdindex_service.edit(key, args)
        
        return record_to_json(gxdindex_record)
    
    @swagger.operation(
        responseClass=GxdIndexRecordFields.__name__,
        nickname="gxdindex_delete"
        )
    def delete(self, key):
        """
        Delete a GxdIndexRecord
        """
        check_permission()
        
        self.gxdindex_service.delete(key)
        return {"success":True}
        


class IndexPriorityResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @swagger.operation(
        responseClass=ChoiceFields.__name__,
        nickname="get_gxdindex_priorities"
        )
    @marshal_with(ChoiceFields.resource_fields)
    def get(self):
        """
        Get all priority key values
        """
        return self.gxdindex_service.get_priority_choices()
    
class ConditionalMutantsValuesResource(Resource):
    
    gxdindex_service = GxdIndexService()
    
    @swagger.operation(
        responseClass=ChoiceFields.__name__,
        nickname="get_gxdindex_conditionalmutants"
        )
    @marshal_with(ChoiceFields.resource_fields)
    def get(self):
        """
        Get all conditionalmutants key values
        """
        return self.gxdindex_service.get_conditionalmutants_choices()
    

api.add_resource(IndexPriorityResource, '/gxdindex/priority')
api.add_resource(ConditionalMutantsValuesResource, '/gxdindex/conditionalmutants')
api.add_resource(GxdIndexListResource, '/gxdindex')
api.add_resource(GxdIndexResource, '/gxdindex/<int:key>')
    

# Helpers
def record_to_json (gxdindex_record):
    """
    retun GxdIndexRecord as json
    """
    json = {}
    for key in gxdindex_record.__table__.columns.keys():
        json[key] = getattr(gxdindex_record, key)
        
    
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

def results_list_json(gxdindex_records):
    """
    return list of GxdIndexRecords as json
    """
    results_json = [result_record_to_json(record) for record in gxdindex_records]
    json = {
        "total_count": len(gxdindex_records),
        "results": results_json    
    }
    return json


def check_permission():
    """
    User must be authenticated and have permission to edit User module
    """
    if not current_user.is_authenticated:
        abort(401, "User not authenticated. Please login first: %s" % url_for('login'))
        
    

