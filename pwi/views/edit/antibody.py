from flask import render_template
from blueprint import edit

@edit.route('/antibody/')
def antibodyQF():
    return render_template( "edit/antibody/antibody.html")

