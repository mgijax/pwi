# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import vocterm_hunter


class EMAPAForm(Form, MGIForm):

        # possible form parameters
        termSearch = TextField('Term Search')

        # invisible form parameters
        term_limit = InvisibleField('EMAPA Term Limit')
                
        def _getParams(self):
            params = {}
            if self.termSearch.data:
                params['termSearch'] = self.termSearch.data
            return params
        
        
        def queryEMAPATerms(self):

            terms = []
            params = self._getParams()
            if params:
                if self.term_limit.data:
                    params['limit'] = self.term_limit.data
                terms = vocterm_hunter.searchEMAPATerms(**params)
            return terms
        
