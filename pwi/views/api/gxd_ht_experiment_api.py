from flask import request, render_template, abort, url_for, jsonify
from flask_restplus import fields, Namespace, reqparse, Resource, Api, inputs
from flask_login import current_user
from flask_json import FlaskJSON, JsonError, json_response, as_json
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdHTExperiment
from mgipython.error import InvalidPermissionError
from mgipython.service_schema.search import SearchQuery, Paginator
from mgipython.service.gxd_ht_experiment_service import GxdHTExperimentService
from pwi import app

api = Namespace('gxdhtexperiment', description='GXD HT Experiment API operations')

gxdhtexperiment_parser = reqparse.RequestParser()
gxdhtexperiment_parser.add_argument('name', type=str, help="Description for Param")
gxdhtexperiment_parser.add_argument('description', type=str)
gxdhtexperiment_parser.add_argument('release_date', type=str)
gxdhtexperiment_parser.add_argument('creation_date', type=str)
gxdhtexperiment_parser.add_argument('modification_date', type=str)
gxdhtexperiment_parser.add_argument('evaluated_date', type=str)
gxdhtexperiment_parser.add_argument('curated_date', type=str)
gxdhtexperiment_parser.add_argument('lastupdate_date', type=str)
gxdhtexperiment_parser.add_argument('_evaluationstate_key', type=int)
gxdhtexperiment_parser.add_argument('_experiment_key', type=int)
gxdhtexperiment_parser.add_argument('notetext', type=str, help="Description for Notes")

gxdhtexperiment_model = api.model('GxdHTExperiment', {
    '_experiment_key': fields.Integer,
    'name': fields.String(description="This is the name"),
    'description': fields.String(description="This is the description"),
    'release_date': fields.Date,
    'creation_date': fields.Date,
    'modification_date': fields.Date,
    'evaluated_date': fields.Date,
    'curated_date': fields.Date,
    'lastupdate_date': fields.Date,
    '_evaluationstate_key': fields.Integer,
    'notetext': fields.String
})

@api.route('/', endpoint='gxdhtexperiment-create-resource')
class GxdHTExperimentCreateResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    @as_json
    def post(self):
        """
        Creates new Experiment
        """
        if not current_user.is_authenticated:
            raise InvalidPermissionError("User not authenticated. Please login first: %s" % url_for('login'))

        args = request.get_json()
        experiment = self.gxdhtexperiment_service.create(args)
        return experiment.serialize()

@api.route('/<int:key>', endpoint='gxdhtexperiment-modify-resource')
@api.param('key', 'mgd.gxd_ht_experiment._experiment_key')
class GxdHTExperimentModifyResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.expect(gxdhtexperiment_model)
    @as_json
    def put(self, key):
        """
        Updates Experiment
        """
        if not current_user.is_authenticated:
            raise InvalidPermissionError("User not authenticated. Please login first: %s" % url_for('login'))

        args = request.get_json()
        experiment = self.gxdhtexperiment_service.save(key, args)
        return experiment.serialize()

    @as_json
    def get(self, key):
        """
        Get Experiment by Key
        """
        experiment = self.gxdhtexperiment_service.get(key)
        return experiment.serialize()

    @as_json
    def delete(self, key):
        """
        Delete Experiment by Key
        """
        if not current_user.is_authenticated:
            raise InvalidPermissionError("User not authenticated. Please login first: %s" % url_for('login'))

        experiment = self.gxdhtexperiment_service.delete(key)
        return experiment.serialize()


@api.route('/search', endpoint='gxdhtexperiment-search-resource')
class GxdHTExperimentSearchResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.doc(description='Implementation Notes Text Field')
    @api.expect(gxdhtexperiment_parser)
    @as_json
    def get(self):
        """
        Get Experiments by Parameters
        """
        args = gxdhtexperiment_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.gxdhtexperiment_service.search(search_query)
        return search_result.serialize()

    @api.expect(gxdhtexperiment_model)
    @as_json
    def post(self):
        """
        Get Experiments by JSON object
        """
        args = request.get_json()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.gxdhtexperiment_service.search(search_query)
        return search_result.serialize()

@api.route('/summary', endpoint='gxdhtexperiment-summary-search-resource')
class GxdHTExperimentSummarySearchResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.doc(description='Implementation Notes Text Field')
    @api.expect(gxdhtexperiment_parser)
    @as_json
    def get(self):
        """
        Get Experiments by Parameters
        """
        args = gxdhtexperiment_parser.parse_args()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.gxdhtexperiment_service.summary_search(search_query)
        return search_result.serialize()

    @api.expect(gxdhtexperiment_model)
    @as_json
    def post(self):
        """
        Get Experiments by JSON object
        """
        args = request.get_json()
        search_query = SearchQuery()
        search_query.set_params(args)
        search_result = self.gxdhtexperiment_service.summary_search(search_query)
        return search_result.serialize()

@api.route('/count', endpoint='gxdhtexperiment-count-resource')
class GxdHTExperimentCountResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    @api.doc(description='Implementation Notes Text Field')
    @as_json
    def get(self):
        """
        Get Total Count of Experiments
        """
        return {"total_count": self.gxdhtexperiment_service.total_count()}

gxdhtsample_parser = reqparse.RequestParser()
gxdhtsample_parser.add_argument('consolidate_rows', type=str, help="Description for Param")

@api.route('/<string:_experiment_key>/samples', endpoint='gxdhtexperiment-samples-resource')
@api.param('_experiment_key', 'gxd_htexperiment._experiment_key')
class GxdHTSampleExperimentResource(Resource):

    gxdhtexperiment_service = GxdHTExperimentService()

    def get(self, _experiment_key):
        """
        Get / Download Samples from Array Express
        """
        args = gxdhtsample_parser.parse_args()
        consolidate_rows = args.get('consolidate_rows') 
        search_result = self.gxdhtexperiment_service.get_samples(_experiment_key, consolidate_rows != "False")
        return search_result.serialize()
