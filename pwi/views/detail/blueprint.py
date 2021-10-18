from flask import Blueprint

# Define the blueprint for all the views in this directory

detail = Blueprint('detail', __name__, url_prefix='/detail')

from . import allele_detail
from . import antibody_detail
from . import assay_detail
from . import experiment_detail
from . import image_detail
from . import marker_detail
from . import probe_detail
from . import vocterm_detail
