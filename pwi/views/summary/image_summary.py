from flask import render_template, request
from blueprint import summary
from pwi.hunter import image_hunter
from pwi.util import error_template
from pwi.model import NOM_Marker
from pwi.forms import ImageForm

# Routes
    
@summary.route('/image',methods=['GET'])
def imageSummary():
    
    # get form params
    form = ImageForm(request.args)
    
    return renderImageSummary(form)
    
# Helpers
    
def renderImageSummary(form):
    
    # transform into the summary format we want
    images = form.queryImages()
        
    return render_template("summary/image/image_summary.html",
                           images=images,
                           form=form,
                           formArgs=form.argString())
    