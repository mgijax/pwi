from flask import render_template
from .blueprint import edit

@edit.route('/alleledetail/')
def assaydetail():
    return render_template( "edit/alleledetail/alleledetail.html")

