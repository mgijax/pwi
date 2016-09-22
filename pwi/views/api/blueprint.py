from flask import Blueprint, jsonify
from flask_restplus_patched import Api
from pwi import app, db
from mgipython.error import NotFoundError, InvalidPermissionError
import psycopg2

# Define the blueprint for all the views in this directory
app.config.SWAGGER_UI_JSONEDITOR = True

api_bp = Blueprint('api', __name__, url_prefix='/api')

# turn blueprint into Flask Restplus object
api = Api(api_bp,
    version='1.0',
    title='PWI API Spec',
    description='This API is for the PWI to interact with the database. This software is managed by the following repository at GitHub <a href=\"https://github.com/mgijax/pwi\">PWI</a>',
    contact="Mouse Genome Informatics",
    contact_email="mgiadmin@jax.org",
    contact_url="http://www.informatics.jax.org"
)

@api_bp.after_request
def api_after_request(response):
    """
    Commit session after every API request
    """
    commit_enabled = True
    if"NO_DB_COMMIT" in app.config and app.config["NO_DB_COMMIT"]:
        commit_enabled = False
    
    if commit_enabled and db.session.is_active:
        db.session.commit()
    return response

                
@api.errorhandler(Exception)
def handle_server_error(error):
    """
    All exceptions get 500 by default
    """
    app.logger.exception(error)
    code = 500
    if hasattr(error, "status"):
        code = error.status 
    return error_response_as_json(error, code)


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
    message = error.message
    if hasattr(error, "data"):
        message += str(error.data)
    response = jsonify({
        'message': message,
        'status_code': status_code,
        'error': error.__class__.__name__
    })
    return response, status_code
                
#import gxd_ht_experiment_api
from emapa_clipboard_api import api as emapa_ns
api.add_namespace(emapa_ns)

from gxdindex_api import api as gxdindex_ns
api.add_namespace(gxdindex_ns)

from gxd_ht_experiment_api import api as gxd_ht_experiment_api
api.add_namespace(gxd_ht_experiment_api)

from marker_api import api as marker_ns
api.add_namespace(marker_ns)

from reference_api import api as reference_ns
api.add_namespace(reference_ns)

from user_api import api as user_ns
api.add_namespace(user_ns)

from vocterm_api import api as vocterm_ns
api.add_namespace(vocterm_ns)
