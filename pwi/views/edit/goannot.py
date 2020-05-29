from flask import render_template
from .blueprint import edit

@edit.route('/goannot/')
def goannotQF():
    return render_template( "edit/goannot/goannot.html")

