# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *
from pwi.hunter import image_hunter
from pwi.hunter import allele_hunter

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
        

        def queryAllele(self):

            params = self._getParams()
            return allele_hunter.getAlleleByMGIID(params['allele_id'])

        def queryImages(self):

            molimages = []
            phenoimages = []

            params = self._getParams()
            if params:
                if self.image_limit.data:
                    params['limit'] = self.image_limit.data
                molimages, phenoimagesbyallele, phenoimagesbygenotype = image_hunter.searchImages(**params)

            return molimages, phenoimagesbyallele, phenoimagesbygenotype
        
