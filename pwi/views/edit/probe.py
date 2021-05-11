from flask import render_template
from .blueprint import edit

@edit.route('/probe/')
def probeQF():
    return render_template( "edit/probe/probe.html")

