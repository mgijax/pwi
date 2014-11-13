# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Reference
from pwi.hunter import reference_hunter

class ReferenceForm(Form, MGIForm):

        # possible form parameters
        accids = TextField('accids')
        
        marker_id = TextField('Marker MGI ID')
                
        def _getParams(self):
            params = {}
            if self.accids.data:
                params['accids'] = self.accids.data
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            return params
        
        
        def queryReferences(self):

            references = []
            params = self._getParams()
            if params:
                references = reference_hunter.searchReferences(**params)
            return references
        
