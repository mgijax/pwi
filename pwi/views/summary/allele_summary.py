from flask import render_template, request
from blueprint import summary
from pwi.hunter import allele_hunter
from pwi.util import error_template
from pwi.model.core import getColumnNames
from pwi.model import Allele
from pwi.forms import AlleleForm

# Constants

# Routes
    
@summary.route('/allele',methods=['GET'])
def alleleSummary():
    
    # get form params
    form = AlleleForm(request.args)
    
    return renderAlleleSummary(form)

    
# Helpers
    
def renderAlleleSummary(form):
    
    # transform into the summary format we want
    #alleles = form.queryAlleles()
        
    return render_template("summary/allele/allele_summary.html",
                           #alleles=alleles,
                           form=form,
                           formArgs=form.argString())
    
