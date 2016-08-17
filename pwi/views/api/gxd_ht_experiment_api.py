from flask import request, render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdHTExperiment
from mgipython.service_schema.search import SearchQuery
from mgipython.service.gxd_ht_experiment_service import GxdHTExperimentService
from pwi import app

api = Namespace('gxdhtexperiment', description='GXD HT Experiment API actions')

gxdhtexperiment_parser = reqparse.RequestParser()
gxdhtexperiment_parser.add_argument('name')
gxdhtexperiment_parser.add_argument('description')

gxdhtexperiment_model = api.model('GxdHTExperiment', {
    'name': fields.String,
	 'description': fields.String
})

@api.route('/', endpoint='gxdhtexperiment-create-resource')
class GxdHTExperimentCreateResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    def post(self):
        experiment = self.gxdhtexperiment_service.create(gxdhtexperiment_model)
        return experiment.serialize()

@api.route('/<int:key>', endpoint='gxdhtexperiment-modify-resource')
@api.param('key', 'mgd.gxd_ht_experiment._experiment_key')
class GxdHTExperimentModifyResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    def put(self, key):
        experiment = self.gxdhtexperiment_service.modify(key, gxdhtexperiment_model)
        return experiment.serialize()

    def get(self, key):
        experiment = self.gxdhtexperiment_service.get_by_key(key)
        return experiment.serialize()

    def delete(self, key):
        experiment = self.gxdhtexperiment_service.delete(key)
        return experiment.serialize()


@api.route('/search', endpoint='gxdhtexperiment-search-resource')
class GxdHTExperimentSearchResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.doc(description='Description')
    @api.expect(gxdhtexperiment_parser)
    def get(self):

        args = gxdhtexperiment_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)

        search_result = self.gxdhtexperiment_service.search(search_query)
        print len(search_result.items)
        return GxdHTExperiment.serialize_list(search_result.items)

    @api.expect(gxdhtexperiment_model)
    def post(self):
        
        args = request.get_json()

        search_query = SearchQuery()
        search_query.set_params(args)

        search_result = self.gxdhtexperiment_service.search(search_query)
        print len(search_result.items)
        return GxdHTExperiment.serialize_list(search_result.items)

