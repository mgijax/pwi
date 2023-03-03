from flask import render_template
from .blueprint import edit

@edit.route('/genotypesummary/')
def genotypesummary():
    return render_template("edit/genotypesummary/genotypesummary.html")

