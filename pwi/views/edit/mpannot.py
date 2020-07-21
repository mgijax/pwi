from flask import render_template
from .blueprint import edit

@edit.route('/mpannot/')
def mpannotQF():
    return render_template( "edit/mpannot/mpannot.html")

