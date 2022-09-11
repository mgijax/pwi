from flask import render_template
from .blueprint import edit

@edit.route('/markerdetail/')
def markerdetail():
    return render_template( "edit/markerdetail/markerdetail.html")

