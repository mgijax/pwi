from flask import render_template, request, Response
from flask_login import current_user
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeCount
from .blueprint import edit
from pwi import app, db
from pwi.hunter import result_hunter
import json

@edit.route('/gxdHTEval/', methods=['GET'])
def gxdHTEval():
     return render_template( "edit/gxd/gxd_ht_experiments.html")
