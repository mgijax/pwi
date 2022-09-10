from flask import render_template
from .blueprint import edit

@edit.route('/mappingdetail/')
def mappingdetail():
    return render_template( "edit/mappingdetail/mappingdetail.html")

