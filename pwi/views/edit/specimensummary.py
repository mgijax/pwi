from flask import render_template
from .blueprint import edit

@edit.route('/specimensummary/')
def specimensummary():
    return render_template("edit/specimensummary/specimensummary.html")

