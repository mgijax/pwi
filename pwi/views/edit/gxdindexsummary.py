from flask import render_template
from .blueprint import edit

@edit.route('/gxdindexsummary/')
def gxdindexsummary():
    return render_template("edit/gxdindexsummary/gxdindexsummary.html")

