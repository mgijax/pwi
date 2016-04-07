from flask import render_template, request
from blueprint import summary
from pwi import app
from mgipython.util import error_template
from pwi.forms import SpecimenForm

# Routes
    
@summary.route('/specimen',methods=['GET'])
def specimenSummary():
    
    # get form params
    form = SpecimenForm(request.args)
    
    return renderSpecimenSummary(form)
    
# Helpers
    
def renderSpecimenSummary(form):
    
    # gather lists of specimens
    specimens = form.querySpecimens()

    return render_template("summary/specimen/specimen_summary.html",
                           form=form,
                           specimens=specimens,
                           formArgs=form.argString())
    