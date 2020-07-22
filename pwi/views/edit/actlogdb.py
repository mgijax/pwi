from flask import render_template
from .blueprint import edit

@edit.route('/actlogdb/')
def actlogdbQF():
    return render_template( "edit/actlogdb/actlogdb.html")

