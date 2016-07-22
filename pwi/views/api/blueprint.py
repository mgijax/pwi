from flask import Blueprint, jsonify
from flask_restful import Api
from flask_restful_swagger import swagger
from pwi import db
from mgipython.exception import NotFoundException

# Define the blueprint for all the views in this directory

api_bp = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_bp)
api = swagger.docs(api, apiVersion='0.1', api_spec_url='/spec')

@api_bp.after_request
def api_after_request(response):
    """
    Commit session after every API request
    """
    db.session.commit()
    return response

@api_bp.errorhandler(500)
def api_error_handler(e):
    """
    Non-existent object urls should throw NotFoundException
    
    Returns 500 status code
    """
    response = json_error_response(e.message)
    return jsonify(response), 500

@api_bp.errorhandler(NotFoundException)
def handle_object_not_found(e):
    """
    Non-existent object urls should throw NotFoundException
    
    Returns 404 status code
    """
    response = json_error_response(e.message)
    return jsonify(response), 404
                

def json_error_response(msg=''):
    """
    Standard json error response
    """
    json = {
        'success': False,
        'error': msg
    }
    return json
                

import user_api