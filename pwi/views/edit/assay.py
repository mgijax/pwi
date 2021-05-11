from flask import render_template
from .blueprint import edit

@edit.route('/assay/')
def assayQF():
    return render_template( "edit/assay/assay.html")

