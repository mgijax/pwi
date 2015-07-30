from flask import Blueprint

# Define the blueprint for all the views in this directory

triage = Blueprint('triage', __name__, url_prefix='/triage')


import triage_history_summary
