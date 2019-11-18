from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

import foo
import emap_browser
import gxd_ht_experiments
import gxdindex
import lit_triage
import image
import user_prototypes
import marker 
import genotype
import doalleleannot
import doannot
import mpannot
import variant
