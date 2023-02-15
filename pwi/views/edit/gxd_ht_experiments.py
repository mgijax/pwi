from flask import render_template, request, Response
from flask_login import current_user
from .blueprint import edit
from pwi import app, db
import json

@edit.route('/gxdHTEval/', methods=['GET'])
def gxdHTEval():
     return render_template( "edit/gxd/gxd_ht_experiments.html")
