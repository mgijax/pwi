from flask import render_template
from .blueprint import edit

@edit.route('/allelesummary/')
def allelesummary():
    return render_template("edit/allelesummary/allelesummary.html")

