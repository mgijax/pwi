# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *


class VocTerm(db.Model,MGIModel):
    __tablename__ = "voc_term"
    _term_key = db.Column(db.Integer,primary_key=True)
    _vocab_key = db.Column(db.Integer)
    term = db.Column(db.String())
    
class VocAnnot(db.Model, MGIModel):
    __tablename__ = "voc_annot"
    _annot_key = db.Column(db.Integer, primary_key=True)
    _annottype_key = db.Column(db.Integer)
    _object_key = db.Column(db.Integer)
    _term_key = db.Column(db.Integer, db.ForeignKey("VocTerm._term_key"))
    
    term = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_term_key)
    )