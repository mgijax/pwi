from flask import render_template
from .blueprint import edit

@edit.route('/probesummary/')
def probesummary():
    return render_template("edit/probesummary/probesummary.html")

