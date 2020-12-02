from flask import render_template
from .blueprint import edit

@edit.route('/strain/')
def strainQF():
    return render_template( "edit/strain/strain.html")

