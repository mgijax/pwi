from flask import render_template
from .blueprint import edit

@edit.route('/assaysummary/')
def assaysummary():
    return render_template("edit/assaysummary/assaysummary.html")

