from flask import render_template
from .blueprint import edit

@edit.route('/assaydetail/')
def assaydetailQF():
    return render_template( "edit/assaydetail/assaydetail.html")

