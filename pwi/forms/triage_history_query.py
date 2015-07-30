# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from wtforms.fields import html5
from widgets import *
from base import *
from pwi.hunter import triage_history_hunter
from pwi.hunter.triage.triage_meta_info import PRIMARY_CURATOR_MAP

class TriageHistoryForm(Form, MGIForm):
        # possible form parameters
        journal = TextField('Journal')
        
        _selectedAreaChoices = ['Probes/Seq',
                                'Mapping',
                                'Allele/Pheno',
                                'Expression',
                                'GO',
                                'Nomen',
                                'Markers']
        selectedAreas = SelectMultipleField("Selected Areas", 
                                            choices = [(s,s) for s in _selectedAreaChoices])
        
        selectedDate = html5.DateField('Selected Date')
        
        
        # TODO(kstone): needs to be in a cache object
        _primaryCuratorChoices = list(set([(v['login'],v['name']) for v in PRIMARY_CURATOR_MAP.values()]))
        _primaryCuratorChoices.sort()
        primaryCurators = SelectMultipleField("Primary Curator", 
                                            choices = _primaryCuratorChoices)
        
        _orderChoices = [('date', 'Last Selected Date'),
                         ('journal', 'Journal, Volume, Issue')]
        
        order = SelectField("Order By",
                                    choices = _orderChoices,
                                    default='date')
        
        # invisible form parameters
        history_limit = InvisibleField('History Limit')
        
        def _getParams(self):
            params = {}
            if self.journal.data:
                params['journal'] = self.journal.data
            if self.selectedAreas.data:
                params['selectedAreas'] = self.selectedAreas.data
            if self.selectedDate.data:
                params['selectedDate'] = self.selectedDate.data
            if self.primaryCurators.data:
                params['primaryCurators'] = self.primaryCurators.data
            if self.order.data:
                params['order'] = self.order.data  
            return params
        
        
        def queryHistory(self):
            """
            returns journal issues and their selected areas 
                as rows, columns
            by building a query based on the form parameters
            return nothing if no viable parameters were entered.
            """
            rows = []
            params = self._getParams()
            if params:
                if self.history_limit.data:
                    params['limit'] = self.history_limit.data
                rows = triage_history_hunter.searchTriageHistory(**params)
                
            return rows
        
        