from flask import render_template
from .blueprint import edit

@edit.route('/organism/')
def organismQF():
    return render_template( "edit/organism/organism.html")

