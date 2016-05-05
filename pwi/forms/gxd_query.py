# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import gxd_assay_hunter, gxd_index_hunter
from pwi import app

class GXDForm(Form, MGIForm):

        # possible form parameters
        marker_id = TextField('Marker MGIID')
        allele_id = TextField('Allele MGIID')
        probe_id = TextField('Probe MGIID')
        refs_id = TextField('Reference JNum')
        antibody_id = TextField('Antibody MGIID')
        
        age = TextField('Age')
        assay_type = TextField('Assay Type')
        
        # invisible form parameters
        assay_limit = InvisibleField('Assay Limit')
        index_limit = InvisibleField('Index Record Limit')
        
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
            if self.antibody_id.data:
                params['antibody_id'] = self.antibody_id.data
            if self.age.data:
                params['age'] = self.age.data
            if self.assay_type.data:
                params['assay_type'] = self.assay_type.data
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
        
        def queryIndexRecords(self):
            """
            returns GxdIndexRecords by building a query based on the form parameters
            returns nothing if no viable parameters were entered
            """
            records = []
            params = self._getParams()
            if params:
                if self.index_limit.data:
                    params['limit'] = self.index_limit.data
                records = gxd_index_hunter.searchIndexRecords(**params)
                
            return records
            
        