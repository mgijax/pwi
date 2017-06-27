from flask import render_template, abort, url_for, request
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from blueprint import api
from mgipython.util import error_template
from mgipython.model import Reference, MGIUser, VocTerm
from mgipython.service.reference_service import ReferenceService
from mgipython.service_schema.search import SearchQuery
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

###--- detailed data for a particular reference ---###

@api.route('/<int:key>', endpoint='reference-modify-resource')
@api.param('key', 'mgd.bib_refs._refs_key')
class ReferenceModifyResource(Resource):

    reference_service = ReferenceService()

    @as_json
    def get(self, key):
        """
        Get reference by _refs_key
        """
        reference = self.reference_service.get_by_key(key)
        return reference.serialize() 

###--- search for references (from reference query form) ---###

# Define the API for searching for References, first for GET requests
search_reference_parser = reqparse.RequestParser()
search_reference_parser.add_argument('title', type=str, help='Title; % is wildcard')
search_reference_parser.add_argument('authors', type=str, help='Authors; % is wildcard')
search_reference_parser.add_argument('primary_author', type=str, help='Primary (first) author; % is wildcard')
search_reference_parser.add_argument('journal', type=str, help='Journal; % is wildcard')
search_reference_parser.add_argument('volume', type=str, help='Volume; % is wildcard')
search_reference_parser.add_argument('year', type=int, help='Year of publication')
search_reference_parser.add_argument('marker_id', type=str, help='ID of marker mentioned in reference')
search_reference_parser.add_argument('allele_id', type=str, help='ID of allele mentioned in reference')
search_reference_parser.add_argument('accids', type=str, help='IDs associated with the reference; can be space- or comma-delimited list')
search_reference_parser.add_argument('issue', type=str, help='reference issue; % is wildcard')
search_reference_parser.add_argument('pages', type=str, help='page range of reference; % is wildcard')
search_reference_parser.add_argument('date', type=str, help='reference date; % is wildcard')
search_reference_parser.add_argument('abstract', type=str, help='NLM (Medline) abstract; % is wildcard')
search_reference_parser.add_argument('notes', type=str, help='mapping experiment notes; % is wildcard')
search_reference_parser.add_argument('reference_type', type=str, help='type of reference; % is wildcard')
search_reference_parser.add_argument('is_review', type=str, help='is this a review article? (Y/N)')

# ...then for POST requests (notice we can include examples for these)
search_reference_model = api.model('ReferenceSearch', {
    'title' : fields.String(description='Title; % is wildcard', example='%Mouse Genome Informatics%'),
    'authors' : fields.String(description='Authors; % is wildcard', example='%Bult%'),
    'primary_author' : fields.String(description='Primary (first) author; % is wildcard', example='Zhu%'),
    'journal' : fields.String(description='Journal; % is wildcard', example='Genome Biol'),
    'volume' : fields.String(description='Volume; % is wildcard', example='4'),
    'year' : fields.Integer(description='Year of publication', example='2003'),
    'marker_id' : fields.String(description='ID of marker mentioned in reference', example=' '),
    'allele_id' : fields.String(description='ID of allele mentioned in reference', example=' '),
    'accids' : fields.String(description='IDs associated with the reference; can be space- or comma-delimited list', example=' '),
    'issue' : fields.String(description='reference issue; % is wildcard', example=' '),
    'pages' : fields.String(description='page range of reference; % is wildcard', example=' '),
    'date' : fields.String(description='reference date; % is wildcard', example=' '),
    'abstract' : fields.String(description='NLM (Medline) abstract; % is wildcard', example=' '),
    'notes' : fields.String(description='mapping experiment notes; % is wildcard', example=' '),
    'reference_type' : fields.String(description='type of reference; % is wildcard', example=' '),
    'is_review' : fields.String(description='is this a review article? (Y/N)', example=' '),
})

@api.route('/search', endpoint='reference-search-resource')
class ReferenceSearchResource(Resource):

    reference_service = ReferenceService()

    @api.doc(description='Search for references via GET')
    @api.expect(search_reference_parser)
    @as_json
    def get(self):
        """
        Get References via GET Parameters
        """
        args = search_reference_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.reference_service.search(search_query)
        return search_result.serialize()

    @api.doc(description='Search for references via POST')
    @api.expect(search_reference_model)
    @as_json
    def post(self):
        """
        Get Experiments via JSON object submitted by POST
        """
        args = request.get_json()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.reference_service.search(search_query)
        return search_result.serialize()
