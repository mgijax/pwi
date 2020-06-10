from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

import foo
import actlogdb
import allele
import antigen
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
import goannot
import mpannot
import simplevocab
import variant
