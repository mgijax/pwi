from flask import render_template, abort, url_for
from flask_restful import fields, marshal_with, reqparse, Resource, Api
from flask_restful_swagger import swagger
from flask_login import current_user
from blueprint import api
from mgipython.util import error_template
from mgipython.model import GxdHTExperiment
from mgipython.service.gxd_ht_experiment_service import GxdHTExperimentService
from pwi import app

class GxdHTExperimentResource(Resource):
    "Describing elephants"
    @swagger.operation(
        notes='some really good notes',
        responseClass=GxdHTExperiment.__name__,
        nickname='upload',
        parameters=[{
              "name": "body",
              "description": "blueprint object that needs to be added. YAML.",
              "required": True,
              "allowMultiple": False,
              "dataType": GxdHTExperiment.__name__,
              "paramType": "body"
        }],
        responseMessages=[{
            "code": 201,
            "message": "Created. The URL of the created blueprint should be in the Location header"
        }, {
            "code": 405,
            "message": "Invalid input"
        }]
    )
    def get(self, todo_id): 
        return "Test"


api.add_resource(GxdHTExperiment, '/gxdhtexp')
