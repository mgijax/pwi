# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *


class Probe(db.Model,MGIModel):
    __tablename__ = "prb_probe"
    _probe_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    # REST TO BE FILLED AS NEEDED
    
    
class Strain(db.Model,MGIModel):
    __tablename__ = "prb_strain"
    _strain_key = db.Column(db.Integer,primary_key=True)
    strain = db.Column(db.String())
    # REST TO BE FILLED AS NEEDED