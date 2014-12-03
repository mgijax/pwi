from flask import Blueprint

# Define the blueprint for all the views in this directory

detail = Blueprint('detail', __name__, url_prefix='/detail')

import allele_detail
import assay_detail
import marker_detail
import vocterm_detail