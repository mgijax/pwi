from flask import render_template
from .blueprint import edit

@edit.route('/imagedetail/')
def imagedetailQF():
    return render_template( "edit/imagedetail/imagedetail.html")

