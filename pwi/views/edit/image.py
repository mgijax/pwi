from flask import render_template
from blueprint import edit

@edit.route('/image/')
def imageQF():
    return render_template( "edit/image/image.html")

@edit.route('/imageGxd/')
def imageGxdQF():
    return render_template( "edit/image/imageGxd.html")

@edit.route('/imageMgd/')
def imageMgdQF():
    return render_template( "edit/image/imageMgd.html")

@edit.route('/imageSubmission/')
def imageSubmissionQF():
    return render_template( "edit/image/imageSubmission.html")
