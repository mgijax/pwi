from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

from . import actlogdb
from . import allele
from . import allelederivation
from . import antibody
from . import antigen
from . import assay
from . import clonelib
from . import emap_browser
from . import gxd_ht_experiments
from . import gxdindex
from . import lit_triage
from . import image
from . import user_prototypes
from . import mapping
from . import marker 
from . import mutantcellline
from . import nonmutantcellline
from . import genotype
from . import doalleleannot
from . import doannot
from . import goannot
from . import mpannot
from . import organism
from . import probe
from . import simplevocab
from . import strain
from . import variant
