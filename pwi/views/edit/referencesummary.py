from flask import render_template
from .blueprint import edit

@edit.route('/referencesummary/')
def referencesummary():
    return render_template("edit/referencesummary/referencesummary.html")

