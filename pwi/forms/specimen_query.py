# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from .widgets import *
from .base import *
from pwi.hunter import specimen_hunter

class SpecimenForm(Form, MGIForm):

        # possible form parameters
        jnum = TextField('Reference JNum')
        
        def _getParams(self):
            params = {}
            if self.jnum.data:
                params['jnum'] = self.jnum.data
            return params
        
        
        def querySpecimens(self):
            """
            Returns specimens based on the form parameters provided.
            Return nothing if no viable parameters were entered.
            """
            specimens = []

            params = self._getParams()
            if params:
                specimens = specimen_hunter.searchSpecimens(**params)
                
            return specimens
        
        