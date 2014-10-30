from flask import Blueprint

# Define the blueprint for all the views in this directory

summary = Blueprint('summary', __name__, url_prefix='/summary')

import marker_summary