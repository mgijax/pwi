from flask import Blueprint
from flask_restful import Api
from flask_restful_swagger import swagger

# Define the blueprint for all the views in this directory

api_bp = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_bp)
api = swagger.docs(api, apiVersion='0.1', api_spec_url='/spec')

import user_api