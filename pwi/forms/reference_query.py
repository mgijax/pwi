# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *

class ReferenceForm(Form, MGIForm):

        # possible form parameters
        accids = TextField('AccIDs')
        primeAuthor = TextField('First Author')
        authors = TextField('Authors')
        journal = TextField('Journal')
        title = TextField('Title')
        volume = TextField('Volume')
        year = TextField('Year')
        marker_id = TextField('Marker MGI ID')
        allele_id = TextField('Allele MGI ID')

        # invisible form parameters
        reference_limit = InvisibleField('Reference Limit')

