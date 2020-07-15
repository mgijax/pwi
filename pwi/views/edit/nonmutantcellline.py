from flask import render_template
from blueprint import edit

@edit.route('/nonmutantcellline/')
def nonmutantcelllineQF():
    return render_template( "edit/nonmutantcellline/nonmutantcellline.html")

