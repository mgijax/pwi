from flask import Blueprint, jsonify
from flask_restplus_custom_error_handlers import Api
from pwi import app, db
from mgipython.error import NotFoundError, InvalidPermissionError
import psycopg2

# Define the blueprint for all the views in this directory

api_bp = Blueprint('api', __name__, url_prefix='/api')

# turn blueprint into Flask Restplus object
api = Api(api_bp)

@api_bp.after_request
def api_after_request(response):
    """
    Commit session after every API request
    """
    if db.session.is_active:
        db.session.commit()
    return response

                
@api.errorhandler(Exception)
def handle_server_error(error):
    """
    All exceptions get 500 by default
    """
    app.logger.exception(error)
    return error_response_as_json(error, 500)


@api.errorhandler(InvalidPermissionError)
def handle_permission_error(error):
    """
    raise 401 if user does not have permission
    """
    return error_response_as_json(error, 401)


@api.errorhandler(NotFoundError)
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
    return response, status_code
                

from emapa_clipboard_api import api as emapa_ns
api.add_namespace(emapa_ns)

from gxdindex_api import api as gxdindex_ns
api.add_namespace(gxdindex_ns)

from reference_api import api as reference_ns
api.add_namespace(reference_ns)

from user_api import api as user_ns
api.add_namespace(user_ns)

