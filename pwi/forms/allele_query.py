# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Allele
from pwi.hunter import allele_hunter

class AlleleForm(Form, MGIForm):

        refs_id = TextField('Reference JNum')
        mrk_id = TextField('Marker ID')
        
        # invisible form parameters
        allele_limit = InvisibleField('Allele Limit')
        
        
        def _getParams(self):
            params = {}
            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data
            if self.mrk_id.data:
                params['mrk_id'] = self.mrk_id.data
            return params
        
        
        def queryAlleles(self):
            """
            returns alleles by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            alleles = []
            params = self._getParams()
            if params:
                if self.allele_limit.data:
                    params['limit'] = self.allele_limit.data
                alleles = allele_hunter.searchAlleles(**params)
                
            return alleles
               