from flask import render_template
from .blueprint import edit

@edit.route('/markersummary/')
def markersummary():
    return render_template("edit/markersummary/markersummary.html")

