from flask import render_template
from .blueprint import edit

@edit.route('/allelefear/')
def allelefearQF():
    return render_template( "edit/allelefear/allelefear.html")

