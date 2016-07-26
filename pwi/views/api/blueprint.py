from flask import Blueprint, jsonify
from flask_restful_custom_error_handlers import Api
from flask_restful_swagger import swagger
from pwi import app, db
from mgipython.exception import NotFoundException
import psycopg2

# Define the blueprint for all the views in this directory

api_bp = Blueprint('api', __name__, url_prefix='/api')

# turn blueprint into Flask Restful object
api_fr = Api(api_bp)

# turn blueprint into Swagger object
api = swagger.docs(api_fr, apiVersion='0.1', api_spec_url='/spec')

@api_bp.after_request
def api_after_request(response):
    """
    Commit session after every API request
    """
    if db.session.is_active:
        db.session.commit()
    return response

                
@api_fr.errorhandler(Exception)
def handle_server_error(error):
    """
    All exceptions get 500 by default
    """
    response = jsonify({'message': error.message})
    response.status_code = 500
    return response


@api_fr.errorhandler(NotFoundException)
def handle_server_error(error):
    """
    raise 404 if a resource object is not found
    """
    response = jsonify({'message': error.message})
    response.status_code = 404
    return response
                

import user_api