# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Marker
from pwi.hunter import marker_hunter, nomen_hunter

class MarkerForm(Form, MGIForm):
        # possible form parameters
        nomen = TextField('Nomenclature')
        
        refs_id = TextField('Reference JNum')
        
        # invisible form parameters
        marker_limit = InvisibleField('Marker Limit')
        
        nomen_limit = InvisibleField('Nomen Limit')
        
        def _getParams(self):
            params = {}
            if self.nomen.data:
                params['nomen'] = self.nomen.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            return params
        
        
        def queryMarkers(self):
            """
            returns markers by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            markers = []
            params = self._getParams()
            if params:
                if self.marker_limit.data:
                    params['limit'] = self.marker_limit.data
                markers = marker_hunter.searchMarkers(**params)
                
            return markers
        
        def queryNomen(self):
            """
            returns nomenclature objects by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            nomens = []
            params = self._getParams()
            if params and 'nomen' in params:
                if self.nomen_limit.data:
                    params['limit'] = self.nomen_limit.data
                    
                # restrict which nomen records to query
                params['nomen_statuses'] = ['Reserved', 
                                 'In Progress', 
                                 'Deleted', 
                                 'Approved']
                nomens = nomen_hunter.searchNOM_Markers(**params)
                
            return nomens
        