from flask import Blueprint

# Define the blueprint for all the views in this directory

summary = Blueprint('summary', __name__, url_prefix='/summary')


from . import experiment_summary
from . import gxd_summary
from . import reference_summary
from . import result_summary
from . import sequence_summary
from . import specimen_summary
