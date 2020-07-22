from flask import render_template
from .blueprint import edit

@edit.route('/mutantcellline/')
def mutantcelllineQF():
    return render_template( "edit/mutantcellline/mutantcellline.html")

