from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

from . import accessionsummary
from . import actlogdb
from . import allele
from . import alleledetail
from . import allelederivation
from . import allelefear
from . import allelesummary
from . import antibody
from . import antibodydetail
from . import antibodysummary
from . import antigen
from . import assay
from . import assaydetail
from . import assaysummary
from . import celltype_browser
from . import clonelib
from . import emap_browser
from . import genotypedetail
from . import gxd_ht_experiments
from . import gxdindex
from . import gxdindexsummary
from . import lit_triage
from . import image
from . import imagedetail
from . import imagepanesummary
from . import imagesummary
from . import user_prototypes
from . import mapping
from . import mappingdetail
from . import mappingsummary
from . import marker 
from . import markerdetail
from . import markersummary
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
from . import probesummary
from . import referencesummary
from . import resultsummary
from . import sequencesummary
from . import simplevocab
from . import specimensummary
from . import strain
from . import variant
from . import voctermdetail
