# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import gxd_assay_hunter

class GXDForm(Form, MGIForm):
        # possible form parameters
        marker_id = TextField('Marker MGIID')
        
        allele_id = TextField('Allele MGIID')
        
        probe_id = TextField('Probe MGIID')
        
        refs_id = TextField('Reference JNum')
        
        # invisible form parameters
        assay_limit = InvisibleField('Assay Limit')
        
        def _getParams(self):
            params = {}
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            if self.allele_id.data:
                params['allele_id'] = self.allele_id.data
            if self.probe_id.data:
                params['probe_id'] = self.probe_id.data
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            return params
        
        
        def queryAssays(self):
            """
            returns assays by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            assays = []
            params = self._getParams()
            if params:
                if self.assay_limit.data:
                    params['limit'] = self.assay_limit.data
                assays = gxd_assay_hunter.searchAssays(**params)
                
            return assays
        