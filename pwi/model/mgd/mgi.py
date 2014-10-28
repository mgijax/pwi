# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *



class NoteType(db.Model,MGIModel):
    __tablename__ = "mgi_notetype"
    _notetype_key = db.Column(db.Integer,primary_key=True)
    notetype = db.Column(db.String())
    
class Note(db.Model,MGIModel):
    __tablename__ = "mgi_note"
    _note_key = db.Column(db.Integer,primary_key=True)
    _object_key = db.Column(db.Integer)
    _mgitype_key = db.Column(db.Integer)
    _notetype_key = db.Column(db.Integer)

    notetype = db.column_property(
                db.select([NoteType.notetype]).
                where(NoteType._notetype_key==_notetype_key)
        )  

    chunks = db.relationship("NoteChunk",
        primaryjoin="Note._note_key==NoteChunk._note_key",
        foreign_keys="[NoteChunk._note_key]",
        order_by="NoteChunk.sequencenum")

    @property
    def text(self):
        return "".join(self.chunks)
    
class NoteChunk(db.Model,MGIModel):
    __tablename__ = "mgi_notechunk"
    _note_key = db.Column(db.Integer,db.ForeignKey("Note._note_key"),primary_key=True)
    sequencenum = db.Column(db.Integer,primary_key=True)
    note = db.Column(db.String())


class Organism(db.Model,MGIModel):
    __tablename__="mgi_organism"
    _organism_key = db.Column(db.Integer,primary_key=True)
    commonname = db.Column(db.String())
    
# define the association table for references
# this is used in defining join relationships
reference_assoc = mgi_table('mgi_reference_assoc',
    db.Column('_object_key',db.Integer()),
    db.Column('_refs_key',db.Integer,db.ForeignKey('bib_refs._refs_key')),
    db.Column('_mgitype_key',db.Integer()),
)

class Synonym(db.Model,MGIModel):
    __tablename__ = "mgi_synonym"
    _synonym_key = db.Column(db.Integer,primary_key=True)
    _object_key = db.Column(db.Integer)
    _mgitype_key = db.Column(db.Integer)
    _synonymtype_key = db.Column(db.Integer)
    _refs_key = db.Column(db.Integer)
    synonym = db.Column(db.String())
    
    def __repr__(self):
        return self.synonym
    