from flask import render_template
from .blueprint import edit

@edit.route('/gxdHTEval/', methods=['GET'])
def gxdHTEval():
     return render_template( "edit/gxd/gxd_ht_experiments.html")
