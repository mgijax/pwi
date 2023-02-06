from flask import render_template
from .blueprint import edit

@edit.route('/sequencesummary/')
def sequencesummary():
    return render_template("edit/sequencesummary/sequencesummary.html")

