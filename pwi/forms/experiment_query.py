# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from .widgets import *
from .base import *
from pwi.hunter import experiment_hunter
from mgipython.model import MappingExperiment

class ExperimentForm(Form, MGIForm):
        # possible form parameters
        marker_id = TextField('Marker ID')
        refs_id = TextField('Reference ID')
         
        # invisible form parameters
        experiment_limit = InvisibleField('Experiment Limit')
        
        def _getParams(self):
            params = {}
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            return params
        
        
        def queryExperiments(self):
            """
            returns experiments by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            experiments = []
            params = self._getParams()
            if params:
                if self.experiment_limit.data:
                    params['limit'] = self.experiment_limit.data
                    
                # exclude certain types
                params['expttypes'] = MappingExperiment.VALID_EXPTTYPES
                
                experiments = experiment_hunter.searchExperiments(**params)
                
            return experiments
        
        