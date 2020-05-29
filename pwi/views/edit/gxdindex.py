from flask import render_template
from .blueprint import edit

@edit.route('/gxdindex/', methods=['GET'])
def gxdIndexModule():
    return render_template( "edit/gxd/gxdindex.html")
