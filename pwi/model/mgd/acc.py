# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *


class LogicalDb(db.Model,MGIModel):
    __tablename__ = "acc_logicaldb"
    _logicaldb_key = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    
class AccessionReference(db.Model,MGIModel):
    __tablename__ = "acc_accessionreference"
    _accession_key = db.Column(db.Integer,
                        mgi_fk("acc_accession._accession_key"),
                        primary_key=True)
    _refs_key = db.Column(db.Integer,
                        mgi_fk("bib_refs._refs_key"),
                        primary_key=True)
    
class Accession(db.Model,MGIModel):
    __tablename__ = "acc_accession"
    _accession_key = db.Column(db.Integer,primary_key=True)
    accid = db.Column(db.String())
    prefixpart = db.Column(db.String())
    numericpart = db.Column(db.Integer())
    _logicaldb_key = db.Column(db.Integer())
    _object_key = db.Column(db.Integer())
    _mgitype_key = db.Column(db.Integer())
    private = db.Column(db.Integer())
    preferred = db.Column(db.Integer())
    
    logicaldb = db.column_property(
            db.select([LogicalDb.name]).
            where(LogicalDb._logicaldb_key==_logicaldb_key)
    )
    
    mgitype = db.relationship("MGIType",
        uselist=False,
        primaryjoin="MGIType._mgitype_key==Accession._mgitype_key",
        foreign_keys="[MGIType._mgitype_key]")
    
    references = db.relationship("Reference",
                secondary=AccessionReference.__table__,
                backref="accessions")
    
    def __repr__(self):
        return "<AccID %s>"%(self.accid,)
    
class MGIType(db.Model,MGIModel):
    __tablename__ = "acc_mgitype"
    _mgitype_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    tablename = db.Column(db.String())