from flask import Blueprint

# Define the blueprint for all the views in this directory

accession = Blueprint('accession', __name__, url_prefix='/accession')

