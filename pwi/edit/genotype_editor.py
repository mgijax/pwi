"""
    Module for editting genotype objects
"""


from pwi.hunter import vocterm_hunter, reference_hunter
from flask.ext.login import current_user
from mgipython.model import Genotype, VocTerm
from mgipython.model.query import batchLoadAttribute
from mgipython.datainput import datainput

from pwi import app
import tempfile
import os


def addMPAnnotation(
                    genotype,
                    term_id=None,
                    ref_jnumid=None,
                    qualifier='',
                    sex='NA'
                    ):
    """
    Adds an MP annotation to genotype
    """

    _annottype_key = Genotype._mp_annottype_key
    
    # lookup the term for given ID
    term = vocterm_hunter.getVocTermByPrimaryID(term_id)
    
    if not qualifier:
        qualifier = None
    _qualifier_key = VocTerm.query.filter_by(_vocab_key=54). \
        filter(VocTerm.term == qualifier).first()._term_key
    
    # lookup reference for given ID
    reference = reference_hunter.getReferenceByID(ref_jnumid)
    
    #build an annotation object to insert
    cols = ['_annot_key(R)',
            '_annottype_key',
            '_object_key',
            '_term_key',
            '_qualifier_key']
    rows = [[1,
             _annottype_key,
             genotype._genotype_key,
             term._term_key,
             _qualifier_key]]
    
    app.logger.debug("cols = %s\nrows = %s" % (cols, rows))
    
    # build the evidence object
    evCols = ['_annotevidence_key(R)',
              '_annot_key(R)',
              '_evidenceterm_key',
              '_refs_key',
              '_modifiedby_key']
    
    #TODO(kstone): need to pull this from form
    _evidenceterm_key = 52280 # inferred from experiment
    evRows = [[1,
               1,
               _evidenceterm_key,
               reference._refs_key,
               current_user._user_key
               ]]
    
    # build the property object
    propCols = ['_annotevidence_key(R)',
              '_propertyterm_key',
              'value',
              'stanza',
              'sequencenum',
              '_modifiedby_key']
    
    #TODO(kstone): need to pull this from form
    _sexprop_term_key = 8836535
    propRows = [[1,
               _sexprop_term_key,
               sex,
               1,
               1,
               current_user._user_key
               ]]
    
    # create the datainput file(s) and process
    
    # TODO(kstone): refactor this messiness
    tf1 = tempfile.mkstemp()
    os.close(tf1[0])
    annotFilename = tf1[1]
    
    tf2 = tempfile.mkstemp()
    os.close(tf2[0])
    evidenceFilename = tf2[1]
    
    tf3 = tempfile.mkstemp()
    os.close(tf3[0])
    propFilename = tf3[1]
    try:
        datainput.writeDataFile(annotFilename, 
            dataRows=rows,
            modelName='VocAnnot',
            columns=cols
        )
        
        datainput.writeDataFile(evidenceFilename, 
            dataRows=evRows,
            modelName='VocEvidence',
            columns=evCols
        )
        
        datainput.writeDataFile(propFilename, 
            dataRows=propRows,
            modelName='VocEvidenceProperty',
            columns=propCols
        )
        
        annotFile = open(annotFilename, 'r')
        evidenceFile = open(evidenceFilename, 'r')
        propFile = open(propFilename, 'r')
        try:
            datainput.processFiles([annotFile, evidenceFile, propFile])
        finally:
            annotFile.close()
            evidenceFile.close()
            propFile.close()
        
    finally:
        os.remove(annotFilename)
        os.remove(evidenceFilename)
        os.remove(propFilename)
    
    
def editMPAnnotation(
                    genotype,
                    annotKey,
                    evidenceKey,
                    term_id=None,
                    ref_jnumid=None,
                    qualifier='',
                    sex='NA'
                    ):
    """
    Edit an MP annotation of genotype
    """

    _annottype_key = Genotype._mp_annottype_key
    
    # lookup the term for given ID
    term = vocterm_hunter.getVocTermByPrimaryID(term_id)
    
    if not qualifier:
        qualifier = None
    _qualifier_key = VocTerm.query.filter_by(_vocab_key=54). \
        filter(VocTerm.term == qualifier).first()._term_key
    
    # lookup reference for given ID
    reference = reference_hunter.getReferenceByID(ref_jnumid)
    
    targetAnnot = None
    targetEvidence = None
    for annot in genotype.mp_annots:
        if annot._annot_key == annotKey:
            targetAnnot = annot
            for evidence in targetAnnot.evidences:
                if evidence._annotevidence_key == evidenceKey:
                    targetEvidence = evidence
    
    #build an annotation object to update
    cols = ['_annot_key',
            '_term_key',
            '_qualifier_key']
    rows = [[targetAnnot._annot_key,
             term._term_key,
             _qualifier_key]]
    
    app.logger.debug("cols = %s\nrows = %s" % (cols, rows))
    
    # build the evidence object
    evCols = ['_annotevidence_key',
              '_refs_key',
              '_modifiedby_key']
    
    evRows = [[targetEvidence._annotevidence_key,
               reference._refs_key,
               current_user._user_key
               ]]
    
    # build the property object
    propCols = ['_annotevidence_key',
              '_propertyterm_key',
              'value',
              'stanza',
              'sequencenum',
              '_modifiedby_key']
    
    #TODO(kstone): need to pull this from form
    _sexprop_term_key = 8836535
    propRows = [[targetEvidence._annotevidence_key,
               _sexprop_term_key,
               sex,
               1,
               1,
               current_user._user_key
               ]]
    
    # create the datainput file(s) and process
    
    # TODO(kstone): refactor this messiness
    tf1 = tempfile.mkstemp()
    os.close(tf1[0])
    annotFilename = tf1[1]
    
    tf2 = tempfile.mkstemp()
    os.close(tf2[0])
    evidenceFilename = tf2[1]
    
    tf3 = tempfile.mkstemp()
    os.close(tf3[0])
    propFilename = tf3[1]
    try:
        datainput.writeDataFile(annotFilename, 
            dataRows=rows,
            modelName='VocAnnot',
            columns=cols
        )
        
        datainput.writeDataFile(evidenceFilename, 
            dataRows=evRows,
            modelName='VocEvidence',
            columns=evCols
        )
        
        datainput.writeDataFile(propFilename, 
            dataRows=propRows,
            modelName='VocEvidenceProperty',
            columns=propCols
        )
        
        annotFile = open(annotFilename, 'r')
        evidenceFile = open(evidenceFilename, 'r')
        propFile = open(propFilename, 'r')
        try:
            datainput.processFiles([annotFile, evidenceFile, propFile])
        finally:
            annotFile.close()
            evidenceFile.close()
            propFile.close()
        
    finally:
        os.remove(annotFilename)
        os.remove(evidenceFilename)
        os.remove(propFilename)
        
    
def deleteMPAnnotation(
                    genotype,
                    term_id=None,
                    ref_jnumid=None,
                    qualifier=''
                    ):
    """
    Deletes an MP annotation for genotype
    """
    
    _annottype_key = Genotype._mp_annottype_key
    
    # lookup the term for given ID
    term = vocterm_hunter.getVocTermByPrimaryID(term_id)
    
    if not qualifier:
        qualifier = None
    _qualifier_key = VocTerm.query.filter_by(_vocab_key=54). \
        filter(VocTerm.term == qualifier).first()._term_key
    
    #TODO(kstone): need to pull this from form
    _evidenceterm_key = 52280 # inferred from experiment
    
    # find the evidence to delete
    batchLoadAttribute(genotype.mp_annots, 'evidences')
    targetEvidence = None
    targetAnnot = None
    for annot in genotype.mp_annots:
        if annot.term_id.lower() == term_id.lower() \
            and annot._qualifier_key == _qualifier_key:
            targetAnnot = annot
            for evidence in annot.evidences:
                if evidence.ref_jnumid.lower() == ref_jnumid.lower() \
                    and evidence._evidenceterm_key == _evidenceterm_key:
                    targetEvidence = evidence
                    
    if targetEvidence:
        
        # do we delete whole annotation or evidence record?
        if len(targetAnnot.evidences) == 1:
            
            #build an annotation object to delete
            cols = ['_annot_key']
            rows = [[targetAnnot._annot_key]]
            modelName = 'VocAnnot'
            
        else:
            #build an evidence object to delete
            cols = ['_annotevidence_key']
            rows = [[targetEvidence._annotevidence_key]]
            modelName = 'VocEvidence'
            
        app.logger.debug("modelName = %s, cols = %s\nrows = %s" % (modelName, cols, rows))
    
         # TODO(kstone): refactor this messiness
        tf1 = tempfile.mkstemp()
        os.close(tf1[0])
        deleteFilename = tf1[1]
       
        try:
            datainput.writeDataFile(deleteFilename, 
                dataRows=rows,
                modelName=modelName,
                columns=cols,
                operation='Delete'
            )
          
            deleteFile = open(deleteFilename, 'r')
            try:
                datainput.processFiles([deleteFile])
            finally:
                deleteFile.close()
            
            
        finally:
            os.remove(deleteFilename)
    