from flask import render_template
from .blueprint import detail
from pwi.hunter import image_hunter
from mgipython.service.reference_service import ReferenceService
from mgipython.util import error_template
from pwi import app
from mgipython.model.query import batchLoadAttribute

reference_service = ReferenceService()

# Routes
@detail.route('/image/key/<int:key>')
def imageDetailByKey(key):
    image = image_hunter.getImageByKey(key)
    if image:
        return renderImageDetail(image)
    #return renderImageDetail()
    
    return error_template('No image found for key= %s' % key)

@detail.route('/image/<string:id>')
def imageDetailById(id):
    image = image_hunter.getImageByMGIID(id)
    if image:
        return renderImageDetail(image)
    #return renderImageDetail()
    
    return error_template('No image found for ID = %s' % id)

# Helpers

def renderImageDetail(image):

    # batch load some expression info for the image detail
    batchLoadAttribute(image.imagepanes, 'insituresults')
    batchLoadAttribute(image.imagepanes, 'insituresults.specimen')
    batchLoadAttribute(image.imagepanes, 'insituresults.specimen.assay')
    batchLoadAttribute(image.imagepanes, 'insituresults.specimen.assay.marker')
    batchLoadAttribute(image.imagepanes, 'gel_assays')
    #batchLoadAttribute(image.imagepanes, 'gel_assay.marker')
    
    # get reference for image
    reference = reference_service.get_by_key(image._refs_key)
    
    return render_template('detail/image_detail.html', image = image, reference = reference)
