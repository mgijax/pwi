# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from mgi import Note, NoteChunk


class Vocab(db.Model,MGIModel):
    __tablename__ = "voc_vocab"
    _vocab_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    
class VocTextChunk(db.Model,MGIModel):
    __tablename__ = "voc_text"
    _term_key = db.Column(db.Integer,mgi_fk("voc_term._term_key"),primary_key=True)
    sequencenum = db.Column(db.Integer(),primary_key=True)
    note = db.Column(db.String())

class VocTerm(db.Model,MGIModel):
    __tablename__ = "voc_term"
    _term_key = db.Column(db.Integer,primary_key=True)
    _vocab_key = db.Column(db.Integer)
    term = db.Column(db.String())
    abbreviation = db.Column(db.String())
    sequencenum = db.Column(db.Integer)
    isobsolete = db.Column(db.Integer)
    
    # constants
    _mgitype_key = 13
    _publiccomment_notetype_key = 1000
    
    primaryid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.preferred==1,
            Accession.private==0, 
            Accession._object_key==_term_key)) 
    )
    
    vocabname = db.column_property(
        db.select([Vocab.name]).
        where(Vocab._vocab_key==_vocab_key) 
    )
    
    # relationships
    secondaryids = db.relationship("Accession",
        primaryjoin="and_(Accession._object_key==VocTerm._term_key,"
                    "Accession._mgitype_key==%d,"
                    "Accession.preferred==0)" % _mgitype_key,
        foreign_keys="[Accession._object_key]"
    )
    
    synonyms = db.relationship("Synonym",
        primaryjoin="and_(VocTerm._term_key==Synonym._object_key, " 
                "Synonym._mgitype_key==%d)" % _mgitype_key,
        order_by="Synonym.synonym",
        foreign_keys="[Synonym._object_key]")
    
    dagnodes = db.relationship("DagNode",
            primaryjoin="and_(DagNode._object_key==VocTerm._term_key,"
                    "DagNode.dag_mgitype_key==%d)" % _mgitype_key,
            foreign_keys="[DagNode._object_key]",
            backref=db.backref("vocterm",uselist=False)
    )
    
    public_commentchunks = db.relationship("NoteChunk",
            primaryjoin="and_(Note._notetype_key==%d,"
                    "VocTerm._term_key==Note._object_key)" % _publiccomment_notetype_key,
            secondary=Note.__table__,
            foreign_keys="[Note._object_key, NoteChunk._note_key]",
            order_by="NoteChunk.sequencenum")
    
    voctextchunks = db.relationship("VocTextChunk",
        order_by="VocTextChunk.sequencenum")
    
    # DEFINED IN dag.py 
    #     Because I can't resolve cyclic import
    #    kstone
    # ancestor_vocterms
    
    @property
    def public_comment(self):
        return "".join([c.note for c in self.public_commentchunks])
    
    @property
    def definition(self):
        return "".join([vtc.note for vtc in self.voctextchunks])

    # for display in lists
    def __repr__(self):
        return self.term


    
class VocAnnot(db.Model, MGIModel):
    __tablename__ = "voc_annot"
    _annot_key = db.Column(db.Integer, primary_key=True)
    _annottype_key = db.Column(db.Integer)
    _object_key = db.Column(db.Integer)
    _term_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    _qualifier_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    
    term = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_term_key)
    )
    
    qualifier = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_qualifier_key)
    )