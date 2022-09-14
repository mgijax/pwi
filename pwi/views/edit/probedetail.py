from flask import render_template
from .blueprint import edit

@edit.route('/probedetail/')
def probedetail():
    return render_template( "edit/probedetail/probedetail.html")

