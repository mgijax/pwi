from flask import render_template
from .blueprint import edit

@edit.route('/doannot/')
def doannotQF():
    return render_template( "edit/doannot/doannot.html")

