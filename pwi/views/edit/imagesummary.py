from flask import render_template
from .blueprint import edit

@edit.route('/imagesummary/')
def imagesummary():
    return render_template( "edit/imagesummary/imagesummary.html")

