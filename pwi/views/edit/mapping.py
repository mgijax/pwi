from flask import render_template
from .blueprint import edit

@edit.route('/mapping/')
def mappingQF():
    return render_template( "edit/mapping/mapping.html")

