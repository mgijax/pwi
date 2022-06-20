from flask import render_template
from .blueprint import edit

@edit.route('/alleledetail/')
def alleledetail():
    return render_template( "edit/alleledetail/alleledetail.html")

