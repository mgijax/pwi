# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from .widgets import *
from .base import *
from pwi.hunter import imagepane_hunter

class ImagepaneForm(Form, MGIForm):

        # possible form parameters
        refs_id = TextField('Reference MGI ID')

        def _getParams(self):

            params = {}

            if self.refs_id.data:
                params['refs_id'] = self.refs_id.data

            return params
        

        def searchImages(self):
            """
            Returns images based on the form parameters provided.
            Return nothing if no viable parameters were entered.
            """
            images = []

            params = self._getParams()
            if params:
                images = imagepane_hunter.searchImages(**params)
                
            return images
        
        
