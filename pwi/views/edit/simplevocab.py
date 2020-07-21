from flask import render_template
from .blueprint import edit

@edit.route('/simplevocab/')
def simplevocabQF():
    return render_template( "edit/simplevocab/simplevocab.html")

