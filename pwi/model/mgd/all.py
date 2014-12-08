# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from mgi import ReferenceAssoc


class Allele(db.Model,MGIModel):
    __tablename__ = "all_allele"
    _allele_key = db.Column(db.Integer,primary_key=True)
    symbol = db.Column(db.String())
    name = db.Column(db.String())
    iswildtype = db.Column(db.Integer())
   
    _mgitype_key = 11
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_allele_key)) 
    )
    
    explicit_references = db.relationship("Reference",
        secondary=ReferenceAssoc.__table__,
        primaryjoin="and_(Allele._allele_key==ReferenceAssoc._object_key, "
                            "ReferenceAssoc._mgitype_key==%d)" % _mgitype_key,
        secondaryjoin="ReferenceAssoc._refs_key==Reference._refs_key",
        foreign_keys="[ReferenceAssoc._object_key, Reference._refs_key]",
        backref="explicit_alleles"
     )
    
    def __repr__(self):
        return "<Allele %s>"%(self.accid,)