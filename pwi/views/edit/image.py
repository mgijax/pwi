from flask import render_template
from blueprint import edit

@edit.route('/image/')
def imageQF():
    return render_template( "edit/image/image.html")

