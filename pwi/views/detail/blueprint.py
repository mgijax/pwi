from flask import Blueprint

# Define the blueprint for all the views in this directory

detail = Blueprint('detail', __name__, url_prefix='/detail')

import allele_detail
import antibody_detail
import assay_detail
import experiment_detail
import image_detail
import marker_detail
import probe_detail
import vocterm_detail