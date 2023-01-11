from flask import render_template
from .blueprint import edit

@edit.route('/antibodysummary/')
def antibodysummary():
    return render_template("edit/antibodysummary/antibodysummary.html")

