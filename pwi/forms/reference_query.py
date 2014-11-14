# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Reference
from pwi.hunter import reference_hunter

class ReferenceForm(Form, MGIForm):

        # possible form parameters
        accids = TextField('accids')
        primeAuthor = TextField('primeAuthor')
        authors = TextField('authors')
        journal = TextField('journal')
        volumn = TextField('volumn')
        year = TextField('year')
        marker_id = TextField('Marker MGI ID')

        # invisible form parameters
        reference_limit = InvisibleField('Reference Limit')
                
        def _getParams(self):
            params = {}
            if self.accids.data:
                params['accids'] = self.accids.data
            if self.primeAuthor.data:
                params['primeAuthor'] = self.primeAuthor.data
            if self.authors.data:
                params['authors'] = self.authors.data
            if self.journal.data:
                params['journal'] = self.journal.data
            if self.volumn.data:
                params['volumn'] = self.volumn.data
            if self.year.data:
                params['year'] = self.year.data
            if self.marker_id.data:
                params['marker_id'] = self.marker_id.data
            return params
        
        
        def queryReferences(self):

            references = []
            params = self._getParams()
            if params:
                if self.reference_limit.data:
                    params['limit'] = self.reference_limit.data
                references = reference_hunter.searchReferences(**params)
            return references
        
