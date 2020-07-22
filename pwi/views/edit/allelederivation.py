from flask import render_template
from blueprint import edit

@edit.route('/allelederivation/')
def alleleDerivationQF():
    return render_template( "edit/allelederivation/allelederivation.html")

