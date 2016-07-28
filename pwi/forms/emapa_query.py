# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *

from flask_login import current_user
from mgipython.service.vocterm_service import VocTermService


class EMAPAForm(Form, MGIForm):
    """
    Search EMAPA terms
    """
    
    vocterm_service = VocTermService()

    # possible form parameters
    termSearch = TextField('Term Search')
    stageSearch = TextField('Stage Search')

    # invisible form parameters
    term_limit = InvisibleField('EMAPA Term Limit')
            
    def _getParams(self):
        params = {}
        if self.termSearch.data:
            params['termSearch'] = self.termSearch.data
        if self.stageSearch.data:
            params['stageSearch'] = self.stageSearch.data
        return params
    
    
    def queryEMAPATerms(self):

        terms = []
        params = self._getParams()
        if params:
            if self.term_limit.data:
                params['limit'] = self.term_limit.data
            terms = self.vocterm_service.search_emapa_terms(**params)
        return terms
        

    
    