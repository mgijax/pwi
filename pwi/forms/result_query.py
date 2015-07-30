# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import result_hunter

class ResultForm(Form, MGIForm):

        # possible form parameters
        marker_id = TextField('Marker MGI ID')
        refs_id = TextField('Reference ID')
        
        # Direct means no child annotations
        direct_structure_id = TextField('Direct Structure ID')

        def _getParams(self):

            params = {}

            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            if self.direct_structure_id.data:
                params['direct_structure_id'] = self.direct_structure_id.data

            return params
        


        def queryResults(self):

            results = []

            params = self._getParams()
            if params:
                results = result_hunter.searchResults(**params)

            return results
        
