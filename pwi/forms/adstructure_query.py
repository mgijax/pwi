# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import adstructure_hunter

class ADStructureForm(Form, MGIForm):

        # possible form parameters
        structure_text = TextField('Structure Contains Text')
        
        theiler_stages = SelectMultipleField('Theiler Stage',
                    choices = [(str(s), str(s)) for s in range(1,29)])

        def _getParams(self):

            params = {}

            if self.structure_text.data:
                params['structure_text'] = self.structure_text.data
                
            if self.theiler_stages.data:
                params['theiler_stages'] = self.theiler_stages.data

            return params
        


        def queryStructures(self):

            structures = []

            params = self._getParams()
            if params:
                structures = adstructure_hunter.searchStructures(**params)

            return structures
        
