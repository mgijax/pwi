# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *


class VocTerm(db.Model,MGIModel):
    __tablename__ = "voc_term"
    _term_key = db.Column(db.Integer,primary_key=True)
    _vocab_key = db.Column(db.Integer)
    term = db.Column(db.String())