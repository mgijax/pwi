from flask import Blueprint

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

from . import foo
from . import actlogdb
from . import emap_browser
from . import gxd_ht_experiments
from . import gxdindex
from . import lit_triage
from . import image
from . import user_prototypes
from . import marker 
from . import genotype
from . import doalleleannot
from . import doannot
from . import goannot
from . import mpannot
from . import variant
