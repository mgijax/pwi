# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *

class EmapSMapping(db.Model, MGIModel):
    __tablename__ = "mgi_emaps_mapping"
    _mapping_key = db.Column(db.Integer, primary_key=True)
    accid = db.Column(db.String())
    emapsid = db.Column(db.String())

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
        order_by="NoteChunk.sequencenum")

    @property
    def text(self):
        return ''.join([c.note for c in self.chunks])

    def __repr__(self):
        return self.text
    
class NoteChunk(db.Model,MGIModel):
    __tablename__ = "mgi_notechunk"
    _note_key = db.Column(db.Integer,mgi_fk("mgi_note._note_key"),primary_key=True)
    sequencenum = db.Column(db.Integer,primary_key=True)
    #note = db.Column(db.String())
    note = db.Column(db.String(convert_unicode='force',unicode_error="ignore"))
    
    def __repr__(self):
        return self.note


class Organism(db.Model,MGIModel):
    __tablename__="mgi_organism"
    _organism_key = db.Column(db.Integer,primary_key=True)
    commonname = db.Column(db.String())
    

class ReferenceAssoc(db.Model, MGIModel):
    __tablename__ = "mgi_reference_assoc"
    _assoc_key = db.Column(db.Integer, primary_key=True)
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    _object_key = db.Column(db.Integer)
    _mgitype_key = db.Column(db.Integer)
    _refassoctype_key = db.Column(db.Integer)

    reference = db.relationship("Reference",
        uselist=False
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
    
class MGIUser(db.Model, MGIModel):
    __tablename__ = "mgi_user"
    _user_key = db.Column(db.Integer, primary_key=True)
    _usertype_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    _userstatus_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    login = db.Column(db.String())
    name = db.Column(db.String())
    
    
    usertype_object = db.relationship("VocTerm",
        primaryjoin="VocTerm._term_key==MGIUser._usertype_key",
        uselist=False)
    
    userstatus_object = db.relationship("VocTerm",
        primaryjoin="VocTerm._term_key==MGIUser._userstatus_key",
        uselist=False)
    
    