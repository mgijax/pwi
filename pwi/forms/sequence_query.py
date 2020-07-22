# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from .widgets import *
from .base import *
from pwi.hunter import sequence_hunter
from mgipython.model import Sequence

class SequenceForm(Form, MGIForm):
        # possible form parameters
        marker_id = TextField('Marker ID')
        
        # invisible form parameters
        sequence_limit = InvisibleField('Sequence Limit')
        
        def _getParams(self):
            params = {}
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            return params
        
        
        def querySequences(self):
            """
            returns sequences by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            sequences = []
            params = self._getParams()
            if params:
                if self.sequence_limit.data:
                    params['limit'] = self.sequence_limit.data
                    
                
                sequences = sequence_hunter.searchSequences(**params)
                
            return sequences
        
        