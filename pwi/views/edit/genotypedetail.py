from flask import render_template
from .blueprint import edit

@edit.route('/genotypedetail/')
def genotypedetail():
    return render_template( "edit/genotypedetail/genotypedetail.html")

