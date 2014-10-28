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
    
    def __repr__(self):
        return "<AccID %s>"%(self.accid,)