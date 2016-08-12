from flask import Blueprint, jsonify
from flask_restful_custom_error_handlers import Api
from flask_restful_swagger import swagger
from pwi import app, db
from mgipython.error import NotFoundError, InvalidPermissionError
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
    app.logger.exception(error)
    return error_response_as_json(error, 500)


@api_fr.errorhandler(InvalidPermissionError)
def handle_permission_error(error):
    """
    raise 401 if user does not have permission
    """
    return error_response_as_json(error, 401)


@api_fr.errorhandler(NotFoundError)
def handle_notfound_error(error):
    """
    raise 404 if a resource object is not found
    """
    return error_response_as_json(error, 404)


def error_response_as_json(error, status_code):
    """
    our standard json format for errors
    """
    response = jsonify({
        'message': error.message,
        'status_code': status_code,
        'error': error.__class__.__name__
    })
    response.status_code = status_code
    return response
                

import emapa_clipboard_api
import gxdindex_api
import reference_api
import user_api