from flask import render_template
from .blueprint import edit

@edit.route('/doalleleannot/')
def doalleleannotQF():
    return render_template( "edit/doalleleannot/doalleleannot.html")

