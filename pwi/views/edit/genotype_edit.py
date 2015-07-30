from flask import render_template, request, redirect, url_for, session
from blueprint import edit
from pwi.hunter.genotype import genotype_hunter
from mgipython.util import error_template
from pwi import app,db
from mgipython.model.query import batchLoadAttribute
from pwi.edit import genotype_editor
from datetime import datetime

# Routes
@edit.route('/genotype/key/<int:key>/annotations')
def genotypeAnnotationsEditByKey(key):
    genotype = genotype_hunter.getGenotypeByKey(key)
    if genotype:
        return renderGenotypeEditAnnotations(genotype)
    
    return error_template('No genotype found for key= %s' % key)

@edit.route('/genotype/<string:id>/annotations')
def genotypeAnnotationsEditById(id):
    genotype = genotype_hunter.getGenotypeByMGIID(id)
    if genotype:
        return renderGenotypeEditAnnotations(genotype)
    
    
    return error_template('No genotype found for ID = %s' % id)


@edit.route('/genotype/<string:id>/annotations/add', methods=['POST'])
def addGenotypeMPAnnotation(id):
    genotype = genotype_hunter.getGenotypeByMGIID(id)
    form = request.form
    app.logger.debug("form = %s " % request.form)
    if genotype:
        
        # add annotation
        genotype_editor.addMPAnnotation(
            genotype=genotype,
            term_id=form['termAccId'],
            ref_jnumid=form['refJnum'],
            qualifier=form['qualifier'],
            sex=form['sex']
        )
        
        if 'mp_annotation' not in session['edits']:
            session['edits']['mp_annotation'] = []
        session['edits']['mp_annotation']. \
                append({'type':'add', 
                        'time': datetime.now(),
                        'cols':['termAccId', 'refJnum','qualifier','sex'],
                        'values':[form['termAccId'], form['refJnum'],form['qualifier'], form['sex']]
                        })
        
        return redirect(url_for('edit.genotypeAnnotationsEditById', id=genotype.mgiid))
    
    return error_template('No genotype found for ID = %s' % id)


@edit.route('/genotype/<string:id>/annotations/delete', methods=['POST'])
def deleteGenotypeMPAnnotation(id):
    genotype = genotype_hunter.getGenotypeByMGIID(id)
    form = request.form
    app.logger.debug("form = %s " % request.form)
    if genotype:
        
        # delete annotation
        genotype_editor.deleteMPAnnotation(
            genotype=genotype,
            term_id=form['termAccId'],
            ref_jnumid=form['refJnum'],
            qualifier=form['qualifier']
        )
        
        if 'mp_annotation' not in session['edits']:
            session['edits']['mp_annotation'] = []
        session['edits']['mp_annotation']. \
                append({'type':'delete', 
                        'time': datetime.now(),
                        'cols':['termAccId', 'refJnum','qualifier','sex'],
                        'values':[form['termAccId'], form['refJnum'],form['qualifier'], '']
                        })
        
        return redirect(url_for('edit.genotypeAnnotationsEditById', id=genotype.mgiid))
    
    return error_template('No genotype found for ID = %s' % id)


@edit.route('/genotype/<string:id>/annotations/edit', methods=['POST'])
def editGenotypeMPAnnotation(id):
    genotype = genotype_hunter.getGenotypeByMGIID(id)
    form = request.form
    app.logger.debug("form = %s " % request.form)
    if genotype:
        
        # find annotation and evidence
        targetAnnot = None
        targetEvidence = None
        for annot in genotype.mp_annots:
            if annot._annot_key == int(form["annotKey"]):
                targetAnnot = annot
                for evidence in targetAnnot.evidences:
                    if evidence._annotevidence_key == int(form["evidenceKey"]):
                        targetEvidence = evidence
                        
        if targetAnnot and targetEvidence:
                           
            # map changes
            term_id = form['termAccId']
            if  term_id != targetAnnot.term_id:
                term_id = "%s -> %s" % (targetAnnot.term_id, term_id)
                
            jnum = form['refJnum']
            if jnum != targetEvidence.ref_jnumid:
                jnum = "%s -> %s" % (targetEvidence.ref_jnumid, jnum)
                
            qualifier = form['qualifier']
            if qualifier != (targetAnnot.qualifier or ''):
                qualifier = "%s -> %s" % (targetAnnot.qualifier, qualifier)
                
            sex = form['sex']
            if sex != targetEvidence.sex:
                sex = "%s -> %s" % (targetEvidence.sex, sex)
                
            # edit annotation
            genotype_editor.editMPAnnotation(
                 genotype=genotype,
                 annotKey=int(form['annotKey']),
                 evidenceKey=int(form['evidenceKey']),
                 term_id=form['termAccId'],
                 ref_jnumid=form['refJnum'],
                 qualifier=form['qualifier'],
                 sex=form['sex']
            )
            
            if 'mp_annotation' not in session['edits']:
                session['edits']['mp_annotation'] = []

                
            session['edits']['mp_annotation']. \
                    append({'type':'edit', 
                            'time': datetime.now(),
                            'cols':['termAccId', 'refJnum','qualifier','sex'],
                            'values':[term_id, jnum, qualifier, sex]
                            })
            
            return redirect(url_for('edit.genotypeAnnotationsEditById', id=genotype.mgiid))
        
        else:
            return error_template('Could not map annotKey=%s, evidenceKey=%s for Genotype ID=%s' %
                                  (form['annotKey'],form['evidenceKey'],id))
    
    return error_template('No genotype found for ID = %s' % id)

# Helpers

def renderGenotypeEditAnnotations(genotype):

    # batch load some annotation info for the genotype edit annotations
    batchLoadAttribute([genotype], 'mp_annots')
    batchLoadAttribute([genotype], 'mp_annots.evidences')
    batchLoadAttribute([genotype], 'mp_annots.evidences.reference')
    batchLoadAttribute([genotype], 'mp_annots.evidences.properties')
    batchLoadAttribute([genotype], 'mp_annots.term_object')
    
    genotype.mp_annots.sort(key=lambda a: a.term)
    
    return render_template('edit/edit_genotype_annotations.html', genotype = genotype)
