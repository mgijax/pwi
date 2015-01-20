# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.model import Image
from pwi.hunter import image_hunter

class ImageForm(Form, MGIForm):

        # possible form parameters
        allele_id = TextField('Allele MGI ID')

        # invisible form parameters
        image_limit = InvisibleField('Image Limit')
                
        def _getParams(self):

            params = {}

            if self.allele_id.data:
                params['allele_id'] = self.allele_id.data

            return params
        
        
        def queryImages(self):

            image = []

            params = self._getParams()
            if params:
                if self.image_limit.data:
                    params['limit'] = self.image_limit.data
                images = image_hunter.searchImages(**params)

            return images
        
