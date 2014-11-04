# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from mgi import Synonym
from mrk import MarkerType
from voc import VocTerm

class NOM_Marker(db.Model,MGIModel):
    __tablename__ = "nom_marker"
    _nomen_key = db.Column(db.Integer,primary_key=True)
    _marker_type_key = db.Column(db.Integer)
    _marker_type_key.hidden = True
    _nomenstatus_key = db.Column(db.Integer)
    _nomenstatus_key.hidden = True
    symbol = db.Column(db.String())
    name = db.Column(db.String())
    chromosome = db.Column(db.String())
    statusnote = db.Column(db.String(convert_unicode='force',unicode_error="ignore"))
    
    # key constants
    
    _mgitype_key = 21
    _nomenstatus_vocab_key = 16
    
    # mapped fields
    
    markertype = db.column_property(
                db.select([MarkerType.name]).
                where(MarkerType._marker_type_key==_marker_type_key)
        )
    
    nomenstatus = db.column_property(
                db.select([VocTerm.term]).
                where(db.and_(VocTerm._term_key==_nomenstatus_key, \
                              VocTerm._vocab_key==_nomenstatus_vocab_key)
                )
        )
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_nomen_key)) 
    )
    
    # one to many objects
    
    synonyms = db.relationship("Synonym",
        primaryjoin="and_(NOM_Marker._nomen_key==Synonym._object_key, " 
                "Synonym._mgitype_key==%d)" % _mgitype_key,
        order_by="Synonym.synonym",
        foreign_keys="[Synonym._object_key]")
    
    def __repr__(self):
        return "<NOM %s (%s) - %s>" % (self.symbol, self.mgiid, self.nomenstatus)