from flask import Blueprint

# Define the blueprint for all the views in this directory

report = Blueprint('report', __name__, url_prefix='/report')


from . import report_views