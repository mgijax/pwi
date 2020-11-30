from flask import render_template
from .blueprint import edit

@edit.route('/stran/')
def stranQF():
    return render_template( "edit/stran/stran.html")

