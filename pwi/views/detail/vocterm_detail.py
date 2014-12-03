from flask import render_template
from blueprint import detail
from pwi.hunter import vocterm_hunter
from pwi.util import error_template
from pwi.model.query import batchLoadAttribute
from pwi import app
from compiler.ast import Node
from pwi.views.detail.dag import DagBuilder

# Routes

@detail.route('/vocterm/key/<int:key>')
def voctermDetailByKey(key):
    vocterm = vocterm_hunter.getVocTermByKey(key)
    if vocterm:
        return renderVocTermDetail(vocterm)

    return error_template('No VocTerm found for _term_key = %d' % key)
    
@detail.route('/vocterm/<string:id>')
def voctermDetailById(id):
    vocterm = vocterm_hunter.getVocTermByPrimaryID(id)
    if vocterm:
        return renderVocTermDetail(vocterm)
    
    return error_template('No VocTerm found for primary ID = %s' % id)

# Helpers

def renderVocTermDetail(vocterm):
    dagtrees = []
    if not vocterm.isobsolete and vocterm.dagnodes:
        # build DAG trees for all the paths
        dagtrees = DagBuilder.buildDagTrees(vocterm.dagnodes)
        
    return render_template('detail/vocterm_detail.html',
                           vocterm = vocterm,
                           dagtrees = dagtrees)
    