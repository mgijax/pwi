from flask import render_template
from .blueprint import edit

@edit.route('/foo/')
def fooQF():
    return render_template( "edit/foo/foo.html")

