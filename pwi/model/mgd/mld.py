# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *

class ExperimentAssayType(db.Model,MGIModel):
    __tablename__ = "mld_assay_types"
    _assay_type_key = db.Column(db.Integer,primary_key=True)
    description = db.Column(db.String())

class ExperimentMarkerAssoc(db.Model,MGIModel):
    __tablename__ = "mld_expt_marker"
    _expt_key = db.Column(db.Integer,
                          mgi_fk("mld_expts._expt_key"),
                          primary_key=True)
    _marker_key = db.Column(db.Integer,
                          mgi_fk("mrk_marker._marker_key"),
                          primary_key=True)
    _allele_key = db.Column(db.Integer,
                          mgi_fk("all_allele._allele_key"),
                          primary_key=True)
    _assay_type_key=db.Column(db.Integer)
    
    sequencenum = db.Column(db.Integer)
    description = db.Column(db.String())
    matrixdata = db.Column(db.Integer)
    
    # key constants
    _mgitype_key=4
    
    # column properties
    assaytype = db.column_property(
                db.select([ExperimentAssayType.description]).
                where(ExperimentAssayType._assay_type_key==_assay_type_key)
        )  
    
    # relationships
    allele = db.relationship("Allele")
    marker = db.relationship("Marker",
            backref="mapping_experiment_assocs")

class MappingExperiment(db.Model,MGIModel):
    __tablename__ = "mld_expts"
    _expt_key = db.Column(db.Integer,primary_key=True)
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    expttype = db.Column(db.String())
    tag = db.Column(db.Integer())
    chromosome = db.Column(db.String())
    
    
    # relationships
    
    marker_assocs = db.relationship("ExperimentMarkerAssoc",
            order_by="ExperimentMarkerAssoc.sequencenum"
    )
    
    reference = db.relationship("Reference",
            backref="mapping_experiments"
    )
    
    
    
    
    