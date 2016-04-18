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
        # for display only
        direct_structure_name = TextField('Structure Name')

        def _getParams(self):

            params = {}

            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            if self.direct_structure_id.data:
                params['direct_structure_id'] = self.direct_structure_id.data

            return params
        


        def queryResults(self, page_size=9999999, page_num=1):
            """
            Defualt page_size to return all results
            """
            results = []

            params = self._getParams()
            if params:
                params['page_size'] = page_size
                params['page_num'] = page_num
                results = result_hunter.searchResults(**params)

            return results
        
