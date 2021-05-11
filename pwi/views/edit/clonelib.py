from flask import render_template
from .blueprint import edit

@edit.route('/clonelib/')
def clonelibQF():
    return render_template( "edit/clonelib/clonelib.html")

