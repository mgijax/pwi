# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Probe
from pwi.hunter import probe_hunter

class ProbeForm(Form, MGIForm):
        # possible form parameters
        marker_id = TextField('Marker ID')
        
        refs_id = TextField('Reference JNum')
        
        # invisible form parameters
        probe_limit = InvisibleField('Probe Limit')
        
        def _getParams(self):
            params = {}
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            return params
        
        
        def queryProbes(self):
            """
            returns probes by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            probes = []
            params = self._getParams()
            if params:
                if self.probe_limit.data:
                    params['limit'] = self.probe_limit.data
                probes = probe_hunter.searchProbes(**params)
                
            return probes
        
        