from flask import Blueprint
from flask_restful import Api

# Define the blueprint for all the views in this directory

api_bp = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_bp)

import user_api