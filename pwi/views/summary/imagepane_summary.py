from flask import render_template, request
from blueprint import summary
from pwi import app
from pwi.hunter import image_hunter
from mgipython.util import error_template
from mgipython.model import NOM_Marker
from mgipython.model.query import batchLoadAttribute
from pwi.forms import ImagepaneForm

# Routes
    
@summary.route('/imagepane',methods=['GET'])
def imagepaneSummary():
    
    # get form params
    form = ImagepaneForm(request.args)
    
    return renderImagepaneSummary(form)
    
# Helpers
    
def renderImagepaneSummary(form):
    
    # gather lists of image pages via hunter
    images = form.searchImages()
    
    # batch load relationships with more efficient SQL
    batchLoadAttribute(images, 'imagepanes')
    batchLoadAttribute(images, 'imagepanes.insituresults')
    batchLoadAttribute(images, 'imagepanes.insituresults.specimen')
    batchLoadAttribute(images, 'imagepanes.insituresults.specimen.assay')
    batchLoadAttribute(images, 'imagepanes.insituresults.specimen.assay.marker')
    batchLoadAttribute(images, 'imagepanes.gel_assays')
    batchLoadAttribute(images, 'imagepanes.gel_assays.marker')
    
    return render_template("summary/imagePane/imagepane_summary.html",
                           form=form,
                           images=images,
                           formArgs=form.argString())
    