from flask import Blueprint

# Define the blueprint for all the views in this directory

detail = Blueprint('detail', __name__, url_prefix='/detail')

import marker_detail