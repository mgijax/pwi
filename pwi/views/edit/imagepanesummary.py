from flask import render_template
from .blueprint import edit

@edit.route('/imagepanesummary/')
def imagepanesummary():
    return render_template( "edit/imagepanesummary/imagepanesummary.html")

