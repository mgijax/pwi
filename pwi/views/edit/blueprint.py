from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

from . import actlogdb
from . import allele
from . import alleledetail
from . import allelederivation
from . import allelefear
from . import antibody
from . import antibodydetail
from . import antigen
from . import assay
from . import assaydetail
from . import celltype_browser
from . import clonelib
from . import emap_browser
from . import gxd_ht_experiments
from . import gxdindex
from . import lit_triage
from . import image
from . import imagedetail
from . import user_prototypes
from . import mapping
from . import mappingdetail
from . import marker 
from . import markerdetail
from . import mutantcellline
from . import nonmutantcellline
from . import genotype
from . import doalleleannot
from . import doannot
from . import goannot
from . import mpannot
from . import organism
from . import probe
from . import probedetail
from . import simplevocab
from . import strain
from . import variant
