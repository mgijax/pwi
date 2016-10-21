from flask import render_template, request
from blueprint import summary
from pwi import app
from pwi.hunter import image_hunter
from mgipython.util import error_template
from mgipython.util import sort
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
    
    # calculate distinct specimen labels for each image pane / assay combo
    def distinctSpecimenLabels(imagepane, assay):
        """
        Return sorted distinct list of specimen labels for this assay
        """
        specimenLabels = set([])
        for result in imagepane.insituresults:
            if result.specimen.assay.mgiid == assay.mgiid:  
                specimenLabels.add(result.specimen.specimenlabel)
        specimenLabels = list(specimenLabels)
        specimenLabels.sort(sort.smartAlphaCompare)
        return specimenLabels
    
    
    return render_template("summary/imagePane/imagepane_summary.html",
                           form=form,
                           images=images,
                           formArgs=form.argString(),
                           distinctSpecimenLabels=distinctSpecimenLabels)
    
