from flask import Blueprint

# Define the blueprint for all the views in this directory

summary = Blueprint('summary', __name__, url_prefix='/summary')


import allele_summary
import antibody_summary
import experiment_summary
import gxd_summary
import image_summary
import marker_summary
import probe_summary
import reference_summary
import result_summary
import sequence_summary
