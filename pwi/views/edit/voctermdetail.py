from flask import render_template
from .blueprint import edit

@edit.route('/voctermdetail/')
def voctermdetail():
    return render_template( "edit/voctermdetail/voctermdetail.html")

