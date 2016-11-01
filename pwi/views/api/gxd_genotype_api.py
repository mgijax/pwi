from flask import request, render_template, abort, url_for, jsonify
from flask_restplus import fields, Namespace, reqparse, Resource, Api, inputs
from flask_login import current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from blueprint import api
from mgipython.util import error_template
from mgipython.model import *
from mgipython.error import *
from mgipython.service_schema import *
from mgipython.service import *
from pwi import app
import re

api = Namespace('gxdgenotype', description='GXD Genotype API operations')

gxdgenotype_parser = reqparse.RequestParser()
gxdgenotype_parser.add_argument('_genotype_key', type=int, help="Genotype Key")
gxdgenotype_parser.add_argument('_strain_key', type=int, help="Strain Key")
gxdgenotype_parser.add_argument('mgiid', type=str, help="Accession Id for Genotype")

gxdgenotype_model = api.model('Genotype', {
    '_genotype_key': fields.Integer,
    '_strain_key': fields.Integer,
    'mgiid': fields.String(description="MGI Accession Id to search for")
})

@api.route('/search', endpoint='gxdgenotype-search-resource')
class GxdGenotypeSearchResource(Resource):

    genotype_service = GxdGenotypeService()

    @api.doc(description='Implementation Notes Text Field')
    @api.expect(gxdgenotype_parser)
    @as_json
    def get(self):
        """
        Get Genotypes by Parameters
        """
        args = gxdgenotype_parser.parse_args()
        return self.search(args).serialize()

    @api.expect(gxdgenotype_model)
    @as_json
    def post(self):
        """
        Get Experiments by JSON object
        """
        args = request.get_json()
        return self.search(args).serialize()

    def search(self, args):
        pattern = re.compile(re.escape('mgi:'), re.IGNORECASE)
        mgiid = pattern.sub('', args["mgiid"])
        mgiid = "MGI:" + mgiid
        args["mgiid"] = mgiid

        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.genotype_service.search(search_query)
        if len(search_result.items) == 0:
            search_query = SearchQuery()
            search_query.set_param('mgiid', "MGI:2166310") # Not Specified
            search_result = self.genotype_service.search(search_query)

        return search_result


