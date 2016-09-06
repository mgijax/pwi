from flask import request, render_template, abort, url_for
from flask_restplus import fields, Namespace, reqparse, Resource, Api, inputs
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdHTExperiment
from mgipython.service_schema.search import SearchQuery, Paginator
from mgipython.service.gxd_ht_experiment_service import GxdHTExperimentService
from mgipython.service.gxd_ht_raw_sample_service import GxdHTRawSampleService
from pwi import app
import json

api = Namespace('gxdhtsample', description='GXD HT Sample API operations')

gxdhtsample_parser = reqparse.RequestParser()
gxdhtsample_parser.add_argument('experimentID', type=str, help="Accession ID for experiment")

gxdhtsample_model = api.model('GxdHTSample', {
    'experimentID': fields.String(description="Accession ID for experiment")
})

#@api.route('/', endpoint='gxdhtexperiment-create-resource')
#class GxdHTExperimentCreateResource(Resource):
#
#    gxdhtexperiment_service = GxdHTExperimentService()
#
#    @api.expect(gxdhtexperiment_model)
#    def post(self):
#        """
#        Creates new Experiment
#        """
#        args = request.get_json()
#        experiment = self.gxdhtexperiment_service.create(args)
#        return experiment.serialize()
#
#@api.route('/<int:key>', endpoint='gxdhtexperiment-modify-resource')
#@api.param('key', 'mgd.gxd_ht_experiment._experiment_key')
#class GxdHTExperimentModifyResource(Resource):
#
#    gxdhtexperiment_service = GxdHTExperimentService()
#
#    @api.expect(gxdhtexperiment_model)
#    def put(self, key):
#        """
#        Updates Experiment
#        """
#        args = request.get_json()
#        experiment = self.gxdhtexperiment_service.save(key, args)
#        return experiment.serialize()
#
#    def get(self, key):
#        """
#        Get Experiment by Key
#        """
#        experiment = self.gxdhtexperiment_service.get(key)
#        return experiment.serialize()
#
#    def delete(self, key):
#        """
#        Delete Experiment by Key
#        """
#        experiment = self.gxdhtexperiment_service.delete(key)
#        return experiment.serialize()


@api.route('/search_raw', endpoint='gxdhtsample-search-raw-resource')
class GxdHTSampleRawSearchResource(Resource):

    gxdhtrawsample_service = GxdHTRawSampleService()

    @api.doc(description='GET search for raw samples by experiment ID')
    @api.expect(gxdhtsample_parser)
    def get(self):
        """
        Get raw samples by experiment ID
        """
        args = gxdhtsample_parser.parse_args()
        return self._perform_query(args)

    @api.doc(description='POST search for raw samples by experiment ID')
    @api.expect(gxdhtsample_model)
    def post(self):
        """
        Get raw samples by experiment ID
        """
        args = request.get_json()
        return self._perform_query(args)

    def _perform_query(self, args):
        search_query = SearchQuery()
        if not args:
            search_query.paginator = Paginator()
            search_query.paginator.page_size = 100

        search_query.set_params(args)

        search_result = self.gxdhtrawsample_service.search(search_query)
        dict = {}
        # not specific to experiments or samples; just a method on base MGIModel
        dict["items"] = search_result.items
        if search_query.paginator:
            dict["paginator"] = { "page_num":search_result.paginator.page_num, "page_size":search_result.paginator.page_size}
        dict["total_count"] = search_result.total_count
        return dict
