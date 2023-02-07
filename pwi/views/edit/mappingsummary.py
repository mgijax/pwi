from flask import render_template
from .blueprint import edit

@edit.route('/mappingsummary/')
def mappingsummary():
    return render_template("edit/mappingsummary/mappingsummary.html")

