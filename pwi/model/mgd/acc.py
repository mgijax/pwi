# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *


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
    
    mgitype = db.relationship("MGIType",
        uselist=False,
        primaryjoin="MGIType._mgitype_key==Accession._mgitype_key",
        foreign_keys="[MGIType._mgitype_key]")
    
    def __repr__(self):
        return "<AccID %s>"%(self.accid,)
    
    
class MGIType(db.Model,MGIModel):
    __tablename__ = "acc_mgitype"
    _mgitype_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    tablename = db.Column(db.String())