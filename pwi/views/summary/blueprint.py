from flask import Blueprint

# Define the blueprint for all the views in this directory

summary = Blueprint('summary', __name__, url_prefix='/summary')


import gxd_summary
import marker_summary
import reference_summary
import allele_summary
import image_summary
