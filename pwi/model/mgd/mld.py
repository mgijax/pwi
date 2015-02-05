# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession

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
    
    sequencenum = db.Column(db.Integer, primary_key=True)
    
    _allele_key = db.Column(db.Integer,
                          mgi_fk("all_allele._allele_key"))
    
    _assay_type_key=db.Column(db.Integer)
    description = db.Column(db.String())
    matrixdata = db.Column(db.Integer)
    
    # column properties
    assaytype = db.column_property(
                db.select([ExperimentAssayType.description]).
                where(ExperimentAssayType._assay_type_key==_assay_type_key)
        )  
    
    # relationships
    allele = db.relationship("Allele")
    marker = db.relationship("Marker",
            backref="mapping_experiment_assocs")
    
    @property
    def matrixdata_display(self):
        return self.matrixdata and 'yes' or 'no'

class MappingExperiment(db.Model,MGIModel):
    __tablename__ = "mld_expts"
    _expt_key = db.Column(db.Integer,primary_key=True)
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    expttype = db.Column(db.String())
    tag = db.Column(db.Integer())
    chromosome = db.Column(db.String())
    
    # key constants
    _mgitype_key = 4
    
    # other constants
    
    # these are expttypes that are valid to display in the P-WI
    VALID_EXPTTYPES = ['TEXT','TEXT-Genetic Cross','TEXT-Physical Mapping',
                       'TEXT-QTL','TEXT-Congenic','TEXT-Meta Analysis',
                       'TEXT-QTL-Candidate Genes']
    
    # column properties
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_expt_key)) 
    )
    
    # relationships
    
    mgiid_object = db.relationship("Accession",
            primaryjoin="and_(Accession._object_key==MappingExperiment._expt_key,"
                            "Accession.prefixpart=='MGI:',"
                            "Accession.preferred==1,"
                            "Accession._logicaldb_key==1,"
                            "Accession._mgitype_key==%d)" % _mgitype_key,
            foreign_keys="[Accession._object_key]",
            uselist=False)
    
    experiment_notechunks = db.relationship("ExperimentNoteChunk")
    
    # beware, this field is limitting its search to only displayable experiment types in the P-WI
    # this lets the marker detail know when to display a summary link to mapping data
    marker_assocs = db.relationship("ExperimentMarkerAssoc",
            primaryjoin="and_(ExperimentMarkerAssoc._expt_key==MappingExperiment._expt_key,"
                            "MappingExperiment.expttype.in_(%s))" % VALID_EXPTTYPES, 
            order_by="ExperimentMarkerAssoc.sequencenum"
    )
    
    reference = db.relationship("Reference",
            backref="mapping_experiments"
    )
    
    @property
    def experimentnote(self):
        return "".join([nc.note for nc in self.experiment_notechunks])
    
    
class MLDReferenceNoteChunk(db.Model, MGIModel):
    __tablename__ = "mld_notes"
    _refs_key = db.Column(db.Integer,
                          mgi_fk("bib_refs._refs_key"),
                          primary_key=True)
    sequencenum = db.Column(db.Integer, primary_key=True)
    note = db.Column(db.String())
    
class ExperimentNoteChunk(db.Model, MGIModel):
    __tablename__ = "mld_expt_notes"
    _expt_key = db.Column(db.Integer,
                          mgi_fk("mld_expts._expt_key"),
                          primary_key=True)
    sequencenum = db.Column(db.Integer, primary_key=True)
    note = db.Column(db.String())
    
    
    