from flask import render_template, request
from blueprint import summary
from pwi import app
from pwi.hunter import image_hunter
from mgipython.util import error_template
from mgipython.model import NOM_Marker
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
    print images.__len__()
    return render_template("summary/imagePane/imagepane_summary.html",
                           form=form,
                           images=images,
                           formArgs=form.argString())
    