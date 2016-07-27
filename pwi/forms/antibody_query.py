# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import antibody_hunter

class AntibodyForm(Form, MGIForm):
        # possible form parameters
        marker_id = TextField('Marker ID')
        
        refs_id = TextField('Reference JNum')
        
        def _getParams(self):
            params = {}
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            return params
        
        
        def queryAntibodies(self):
            """
            returns antibodies by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            antibodies = []
            params = self._getParams()
            if params:
                antibodies = antibody_hunter.searchAntibodies(**params)
                
            return antibodies
        
        