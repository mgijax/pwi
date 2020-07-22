from flask import render_template
from .blueprint import edit

@edit.route('/allele/')
def alleleQF():
    return render_template( "edit/allele/allele.html")

