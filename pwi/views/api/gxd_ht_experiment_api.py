from flask import request, render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdHTExperiment
from mgipython.service_schema.search import SearchQuery, Paginator
from mgipython.service.gxd_ht_experiment_service import GxdHTExperimentService
from pwi import app
import json

api = Namespace('gxdhtexperiment', description='GXD HT Experiment API operations')

gxdhtexperiment_parser = reqparse.RequestParser()
gxdhtexperiment_parser.add_argument('name', type=str, help="Description for Param")
gxdhtexperiment_parser.add_argument('description')
gxdhtexperiment_parser.add_argument('release_date')

gxdhtexperiment_model = api.model('GxdHTExperiment', {
    'name': fields.String,
	 'description': fields.String,
	 'release_date': fields.Date
})

@api.route('/', endpoint='gxdhtexperiment-create-resource')
class GxdHTExperimentCreateResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    def post(self):
        """
        Creates new Experiment
        """
        args = request.get_json()
        experiment = self.gxdhtexperiment_service.create(args)
        return experiment.serialize()

@api.route('/<int:key>', endpoint='gxdhtexperiment-modify-resource')
@api.param('key', 'mgd.gxd_ht_experiment._experiment_key')
class GxdHTExperimentModifyResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    def put(self, key):
        """
        Updates Experiment
        """
        args = request.get_json()
        experiment = self.gxdhtexperiment_service.save(key, args)
        return experiment.serialize()

    def get(self, key):
        """
        Get Experiment by Key
        """
        experiment = self.gxdhtexperiment_service.get(key)
        return experiment.serialize()

    def delete(self, key):
        """
        Delete Experiment by Key
        """
        experiment = self.gxdhtexperiment_service.delete(key)
        return experiment.serialize()


@api.route('/search', endpoint='gxdhtexperiment-search-resource')
class GxdHTExperimentSearchResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.doc(description='Implementation Notes Text Field')
    @api.expect(gxdhtexperiment_parser)
    def get(self):
        """
        Get Experiments by Parameters
        """
        args = gxdhtexperiment_parser.parse_args()
        return self._perform_query(args)

    @api.expect(gxdhtexperiment_model)
    def post(self):
        """
        Get Experiments by JSON object
        """
        args = request.get_json()
        return self._perform_query(args)
          

    def _perform_query(self, args):
        search_query = SearchQuery()
        if not args:
            search_query.paginator = Paginator()
            search_query.paginator.page_size = 100

        search_query.set_params(args)

        search_result = self.gxdhtexperiment_service.search(search_query)
        dict = {}
        dict["items"] = GxdHTExperiment.serialize_list(search_result.items)
        if search_query.paginator:
            dict["paginator"] = { "page_num":search_result.paginator.page_num, "page_size":search_result.paginator.page_size}
        dict["total_count"] = search_result.total_count
        return dict

