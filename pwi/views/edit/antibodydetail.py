from flask import render_template
from .blueprint import edit

@edit.route('/antibodydetail/')
def antibodydetail():
    return render_template( "edit/antibodydetail/antibodydetail.html")

