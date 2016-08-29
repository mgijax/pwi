from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

import emap_browser
import gxd_ht_experiments
import gxdindex
import user_prototypes
