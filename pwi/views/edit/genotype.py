from flask import render_template
from .blueprint import edit

@edit.route('/genotype/')
def genotypeQF():
    return render_template( "edit/genotype/genotype.html")

