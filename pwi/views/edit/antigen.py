from flask import render_template
from .blueprint import edit

@edit.route('/antigen/')
def antigenQF():
    return render_template( "edit/antigen/antigen.html")

