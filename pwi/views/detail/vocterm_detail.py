from flask import render_template
from blueprint import detail
from pwi.hunter import vocterm_hunter, adstructure_hunter
from mgipython.util import error_template
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeCount
from pwi import app
from mgipython.util.dag import DagBuilder, ADDagBuilder
from pwi.forms import ADStructureForm

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


# TODO (kstone): Obsolete these AD specific pages and templates when AD vocab retires
# Any EMAPS extras should hang off the vocterm detail
@detail.route('/adstructure/key/<int:key>')
def adstructureDetailByKey(key):
    adstructure = adstructure_hunter.getStructureByKey(key)
    if adstructure:
        return renderADStructureDetail(adstructure)

    return error_template('No AD Structure found for _term_key = %d' % key)
    
@detail.route('/adstructure/<string:id>')
def adstructureDetailById(id):
    adstructure = adstructure_hunter.getStructureByPrimaryID(id)
    if adstructure:
        return renderADStructureDetail(adstructure)
    
    return error_template('No AD Structure found for MGI ID = %s' % id)


# Helpers

def renderVocTermDetail(vocterm):
    dagtrees = []
    if not vocterm.isobsolete and vocterm.dagnodes:
        # build DAG trees for all the paths
        dagtrees = DagBuilder.buildDagTrees(vocterm.dagnodes)
        
    return render_template('detail/vocterm_detail.html',
                           vocterm = vocterm,
                           dagtrees = dagtrees)

def renderADStructureDetail(adstructure):
    dagtrees = []
    
    # build DAG trees for all the paths
    dagtrees = ADDagBuilder.buildDagTrees([adstructure])
    
    # check if structure has assay results
    batchLoadAttributeCount([adstructure], 'results')
        
    return render_template('detail/adstructure_detail.html',
                           adstructure = adstructure,
                           dagtrees = dagtrees,
                           form = ADStructureForm())

    