# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from bib import Reference
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
    primaryid_object = db.relationship("Accession",
        primaryjoin="and_(Accession._object_key==VocTerm._term_key,"
                    "Accession.preferred==1,"
                    "Accession.private==0,"
                    "Accession._mgitype_key==%d)" % _mgitype_key,
        foreign_keys="[Accession._object_key]",
        uselist=False)
    
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
    
    term_id = db.column_property(
        db.select([VocTerm.primaryid]).
        where(VocTerm._term_key==_term_key)
    )
    
    term_seq = db.column_property(
        db.select([VocTerm.sequencenum]).
        where(VocTerm._term_key==_term_key)
    )
    
    qualifier = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_qualifier_key)
    )
    
    term_object = db.relationship("VocTerm",
            primaryjoin="VocTerm._term_key==VocAnnot._term_key",
            uselist=False)
    
    evidences = db.relationship("VocEvidence",
        order_by="VocEvidence._refs_key")
    
    
    def addEvidence(self, evidence):
        """
        Ensures that only unique evidence records are added
        """
        for ev in self.evidences:
            if ev._annotevidence_key == evidence._annotevidence_key:
                return
        
        self.evidences.append(evidence)
    
    def __init__(self):
        # add any non-database attribute defaults
        self.calc_depth = 0
    
    @db.reconstructor
    def init_on_load(self):
        self.__init__()
    
    
class VocAnnotHeader(db.Model, MGIModel):
    __tablename__ = "voc_annotheader"
    _annotheader_key = db.Column(db.Integer, primary_key=True)
    _annottype_key = db.Column(db.Integer)
    _object_key = db.Column(db.Integer, mgi_fk("gxd_genotype._genotype_key"))
    _term_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    isnormal = db.Column(db.Integer)
    sequencenum = db.Column(db.Integer)
    
    term = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_term_key)
    )
    
    
class VocEvidence(db.Model, MGIModel):
    __tablename__ = "voc_evidence"
    _annotevidence_key = db.Column(db.Integer, primary_key=True)
    _annot_key = db.Column(db.Integer, mgi_fk("voc_annot._annot_key"))
    _evidenceterm_key = db.Column(db.Integer)
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    
    _mgitype_key = 25
    _refstype_key = 1
    
    ref_jnumid = db.column_property(
        db.select([Accession.accid]). \
        where(db.and_(Accession._mgitype_key==_refstype_key, 
            Accession.prefixpart=='J:', 
            Accession._object_key==_refs_key)) 
    )
    
    notes = db.relationship("Note",
        primaryjoin="and_(Note._object_key==VocEvidence._annotevidence_key,"
                        "Note._mgitype_key==%d)" % _mgitype_key,
        foreign_keys="[Note._object_key]"
    )
    
    properties = db.relationship("VocEvidenceProperty",
                order_by="[VocEvidenceProperty.sequencenum]")
    
    @property
    def sex(self):
        sex = ''
        for prop in self.properties:
            if prop.propertyterm == 'MP-Sex-Specificity':
                sex = prop.value
                break
        return sex
    
    
    
class VocEvidenceProperty(db.Model, MGIModel):
    __tablename__ = "voc_evidence_property"
    _evidenceproperty_key = db.Column(db.Integer, primary_key=True)
    _annotevidence_key = db.Column(db.Integer, mgi_fk("voc_evidence._annotevidence_key"))
    _propertyterm_key = db.Column(db.Integer)
    value = db.Column(db.String())
    sequencenum = db.Column(db.Integer)
    
    propertyterm = db.column_property(
        db.select([VocTerm.term]). \
        where(VocTerm._term_key==_propertyterm_key) 
    )
    
    