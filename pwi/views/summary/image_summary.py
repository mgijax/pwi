from flask import render_template, request
from blueprint import summary
from pwi import app
from pwi.hunter import image_hunter
from mgipython.util import error_template
from pwi.forms import ImageForm

# Routes
    
@summary.route('/image',methods=['GET'])
def imageSummary():
    
    # get form params
    form = ImageForm(request.args)
    
    return renderImageSummary(form)
    
# Helpers
    
def renderImageSummary(form):
    
    # gather lists of the three possible image catagories
    molimages, phenoimagesbyallele, phenoimagesbygenotype = form.queryImages()

    # gather the allele for this summary
    allele = form.queryAllele()
        
    return render_template("summary/image/image_summary.html",
                           molimages=molimages,
                           phenoimagesbyallele=phenoimagesbyallele,
                           phenoimagesbygenotype=phenoimagesbygenotype,
                           allele=allele,
                           form=form,
                           formArgs=form.argString())
    
