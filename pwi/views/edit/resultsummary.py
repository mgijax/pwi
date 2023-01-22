from flask import render_template
from .blueprint import edit

@edit.route('/resultsummary/')
def resultsummary():
    return render_template("edit/resultsummary/resultsummary.html")

