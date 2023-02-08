from flask import render_template
from .blueprint import edit

@edit.route('/accessionsummary/')
def accessionsummary():
    return render_template("edit/accessionsummary/accessionsummary.html")

