# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from gxd import AlleleGenotype
from mrk import *
from mgi import *
from voc import *

###############################
###   Associative Objects   ###
###############################

### Views ###

class AlleleCelllineView(db.Model,MGIModel):
    __tablename__="all_cellline_view"
    _cellline_key = db.Column(db.Integer,mgi_fk("all_allele_cellline._mutantcellline_key"),primary_key=True)
    cellline = db.Column(db.String())
    parentcellline = db.Column(db.String())
    celllinestrain = db.Column(db.String())
    vector = db.Column(db.String())
    vectortype = db.Column(db.String())
    celllinetype = db.Column(db.String())

class AlleleAnnotView(db.Model,MGIModel):
    """
    Allele to Annotation association view
    """
    __tablename__="all_annot_view"
    _allele_key = db.Column(db.Integer,
                            mgi_fk("all_allele._allele_key"),
                            primary_key=True)
    _annot_key = db.Column(db.Integer(),
                           mgi_fk("voc_annot._annot_key"),
                           primary_key=True)

class ImagePaneAssocView(db.Model,MGIModel):
    __tablename__="img_imagepane_assoc_view"
    _assoc_key = db.Column(db.Integer,primary_key=True)
    _imagepane_key = db.Column(db.Integer,
                               mgi_fk("img_imagepane._imagepane_key"),
                               primary_key=True)
    _object_key = db.Column(db.Integer())
    _mgitype_key = db.Column(db.Integer())
    _imageclass_key = db.Column(db.Integer())
    isprimary = db.Column(db.Integer())
    mgiid = db.Column(db.String())


### Allele tables ###

class AlleleMarkerAssoc(db.Model,MGIModel):
    __tablename__="all_marker_assoc"
    _assoc_key = db.Column(db.Integer,primary_key=True)
    _marker_key = db.Column(db.Integer,mgi_fk("mrk_marker._marker_key"))
    _allele_key = db.Column(db.Integer,mgi_fk("all_allele._allele_key"))
    _qualifier_key = db.Column(db.Integer())
    _status_key = db.Column(db.Integer())


class AlleleCelllineAssoc(db.Model,MGIModel):
    __tablename__="all_allele_cellline"
    _assoc_key = db.Column(db.Integer,primary_key=True)
    _allele_key = db.Column(db.Integer,mgi_fk("all_allele._allele_key"))
    _mutantcellline_key = db.Column(db.Integer)
    allelecelllineview = db.relationship("AlleleCelllineView", uselist=False)

class AlleleMutation(db.Model,MGIModel):
    __tablename__="all_allele_mutation"
    _allele_key = db.Column(db.Integer,
                            mgi_fk("all_allele._allele_key"),
                            primary_key=True)
    _mutation_key = db.Column(db.Integer(),
                           mgi_fk("voc_term._term_key"),
                           primary_key=True)

########################
###   Main Objects   ###
########################

class Allele(db.Model,MGIModel):

    __tablename__ = "all_allele"
    _allele_key = db.Column(db.Integer,primary_key=True)
    _allele_status_key = db.Column(db.Integer)
    _allele_status_key.hidden = True
    _allele_type_key=db.Column(db.Integer())
    _allele_type_key.hidden=True
    _mode_key=db.Column(db.Integer())
    _mode_key.hidden=True
    _transmission_key=db.Column(db.Integer())
    _collection_key=db.Column(db.Integer())
    iswildtype = db.Column(db.Integer())
    name = db.Column(db.String())
    symbol = db.Column(db.String())
   
    # key constants
    _mgitype_key = 11
    _allele_status_vocab_key = 37
    _molecular_mutation_key = 36
    _allele_type_vocab_key = 38
    _transmission_vocab_key = 61
    _collection_vocab_key = 92
    _mode_vocab_key = 59
    _allele_subtype_voc_annot_key = 1014    
    _allele_driver_note_type = 1034    
    _nomen_note_type = 1022
    _mp_annottype_key = 1002
    _disease_geno_anottype_key = 1005
    _disease_allele_annottype_key = 1012
    # joined fields

    alleletype = db.column_property(
        db.select([VocTerm.term]).
        where(db.and_(VocTerm._term_key==_allele_type_key, \
            VocTerm._vocab_key==_allele_type_vocab_key))
    )

    collection = db.column_property(
        db.select([VocTerm.term]).
        where(db.and_(VocTerm._term_key==_collection_key, \
            VocTerm._vocab_key==_collection_vocab_key))
    )

    #mgiid = db.Column(db.String())
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_allele_key)) 
    )

    modeRaw = db.column_property(
        db.select([VocTerm.term]).
        where(db.and_(VocTerm._term_key==_mode_key, \
            VocTerm._vocab_key==_mode_vocab_key))
    )

    status = db.column_property(
        db.select([VocTerm.term]).
        where(db.and_(VocTerm._term_key==_allele_status_key, \
            VocTerm._vocab_key==_allele_status_vocab_key))
    )

    transmission = db.column_property(
        db.select([VocTerm.term]).
        where(db.and_(VocTerm._term_key==_transmission_key, \
            VocTerm._vocab_key==_transmission_vocab_key))
    )
    
    # relationships
    mgiid_object = db.relationship("Accession",
                    primaryjoin="and_(Accession._object_key==Allele._allele_key,"
                                    "Accession.prefixpart=='MGI:',"
                                    "Accession.preferred==1,"
                                    "Accession._logicaldb_key==1,"
                                    "Accession._mgitype_key==%d)" % _mgitype_key,
                    foreign_keys="[Accession._object_key]",
                    uselist=False)
    
    allelecelllineassoc = db.relationship("AlleleCelllineAssoc")

    molecularmutation = db.relationship("VocTerm",
            secondary=AlleleMutation.__table__,
            secondaryjoin="and_(VocTerm._term_key==AlleleMutation._mutation_key,"
                        "VocTerm._vocab_key ==%d)" % _molecular_mutation_key)

    transmissionref = db.relationship("ReferenceAssoc",
        primaryjoin="and_(Allele._allele_key==ReferenceAssoc._object_key, ReferenceAssoc._refassoctype_key==1023, ReferenceAssoc._mgitype_key==%d)" % _mgitype_key,
        foreign_keys="[ReferenceAssoc._object_key]",
        uselist=False
    )

    molecularrefs = db.relationship("ReferenceAssoc",
        primaryjoin="and_(Allele._allele_key==ReferenceAssoc._object_key, ReferenceAssoc._refassoctype_key==1012, ReferenceAssoc._mgitype_key==%d)" % _mgitype_key,
        foreign_keys="[ReferenceAssoc._object_key]"
    )

    primaryimagepane = db.relationship("ImagePane",
        primaryjoin="and_(Allele._allele_key==ImagePaneAssocView._object_key, "
                    "ImagePaneAssocView._imageclass_key==6481782, "
                    "ImagePaneAssocView.isprimary==1, "
                    "ImagePaneAssocView._mgitype_key==%d)" % _mgitype_key,
        secondary=ImagePaneAssocView.__table__,
        secondaryjoin="ImagePaneAssocView._imagepane_key==ImagePane._imagepane_key",
        foreign_keys="[ImagePaneAssocView._object_key, ImagePaneAssocView._imagepane_key]",
        uselist=False
    )

    molecularimage = db.relationship("ImagePaneAssocView",
        primaryjoin="and_(Allele._allele_key==ImagePaneAssocView._object_key, ImagePaneAssocView._imageclass_key==6481783, ImagePaneAssocView._mgitype_key==%d)" % _mgitype_key,
        foreign_keys="[ImagePaneAssocView._object_key]"
    )

    synonyms = db.relationship("Synonym",
        primaryjoin="and_(Allele._allele_key==Synonym._object_key, " 
                "Synonym._mgitype_key==%d)" % _mgitype_key,
        order_by="Synonym.synonym",
        foreign_keys="[Synonym._object_key]"
    )
    
    subtypes = db.relationship("VocTerm",
        secondary=VocAnnot.__table__,
        primaryjoin="and_(Allele._allele_key==VocAnnot._object_key, "
                            "VocAnnot._annottype_key==%d)" % _allele_subtype_voc_annot_key,
        secondaryjoin="VocAnnot._term_key==VocTerm._term_key",
        foreign_keys="[Allele._allele_key,VocTerm._term_key]",
        backref="explicit_subtypes"
    )

    drivernote = db.relationship("Note",
        primaryjoin="and_(Allele._allele_key==Note._object_key, " 
                "Note._mgitype_key==11, Note._notetype_key==1034) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    induciblenote = db.relationship("Note",
        primaryjoin="and_(Allele._allele_key==Note._object_key, " 
                "Note._mgitype_key==11, Note._notetype_key==1032) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    nomennoteRaw = db.relationship("Note",
        primaryjoin="and_(Allele._allele_key==Note._object_key, " 
                "Note._mgitype_key==11, Note._notetype_key==1022) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    generalnoteRaw = db.relationship("Note",
        primaryjoin="and_(Allele._allele_key==Note._object_key, " 
                "Note._mgitype_key==11, Note._notetype_key==1020) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    molecularnote = db.relationship("Note",
        primaryjoin="and_(Allele._allele_key==Note._object_key, " 
                "Note._mgitype_key==11, Note._notetype_key==1021) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    marker = db.relationship("Marker",
        secondary=AlleleMarkerAssoc.__table__,
        primaryjoin="and_(Allele._allele_key==AlleleMarkerAssoc._allele_key) ", 
        secondaryjoin="AlleleMarkerAssoc._marker_key==Marker._marker_key",
        foreign_keys="[Allele._allele_key,Marker._marker_key]",
        uselist=False,
        backref="alleles"
    )
    
    mp_annots = db.relationship("VocAnnot",
            secondary=AlleleAnnotView.__table__,
            secondaryjoin="and_(VocAnnot._annot_key==AlleleAnnotView._annot_key,"
                        "VocAnnot._annottype_key==%d)" % _mp_annottype_key)
          
    disease_annots = db.relationship("VocAnnot",
            secondary=AlleleAnnotView.__table__,
            secondaryjoin="and_(VocAnnot._annot_key==AlleleAnnotView._annot_key,"
                        "VocAnnot._annottype_key.in_(%s))" % 
                        [_disease_geno_anottype_key,_disease_allele_annottype_key])


    explicit_references = db.relationship("Reference",
        secondary=ReferenceAssoc.__table__,
        primaryjoin="and_(Allele._allele_key==ReferenceAssoc._object_key, "
                            "ReferenceAssoc._mgitype_key==%d)" % _mgitype_key,
        secondaryjoin="ReferenceAssoc._refs_key==Reference._refs_key",
        foreign_keys="[ReferenceAssoc._object_key, Reference._refs_key]",
        backref="explicit_alleles"
     )
    
    genotypes = db.relationship("Genotype",
            secondary=AlleleGenotype.__table__,
            order_by="AlleleGenotype.sequencenum")


    # transient property methods

    @property
    def allelecelllines(self):
        return ", ".join([assoc.allelecelllineview.cellline for assoc in self.allelecelllineassoc])

    @property
    def alleleparentcellline(self):
        parentCellLine = ""
        if (self.allelecelllineassoc):
            # use first allele assoc - data identical for this field
            parentCellLine = self.allelecelllineassoc[0].allelecelllineview.parentcellline
        return parentCellLine

    @property
    def celllinestrain(self):
        strain = ""
        if (self.allelecelllineassoc):
            # use first allele assoc - data identical for this field
            strain = self.allelecelllineassoc[0].allelecelllineview.celllinestrain
        return strain

    @property
    def celllinetype(self):
        celllinetype = ""
        if (self.allelecelllineassoc):
            # use first allele assoc - data identical for this field
            celllinetype = self.allelecelllineassoc[0].allelecelllineview.celllinetype
        return celllinetype

    @property
    def disease_terms(self):
        terms = [d.term for d in self.disease_annots]
        terms.sort()
        return terms

    @property
    def generalnote(self):
        generalnote = self.generalnoteRaw or ''
        return generalnote

    @property
    def mode(self):
        mode = self.modeRaw or ''
        return mode

    @property
    def molecularimageid(self):
        imageMgiID = ""
        if (self.molecularimage):
            # use first allele assoc - data identical for this field
            imageMgiID = self.molecularimage[0].mgiid
        return imageMgiID
    
    @property
    def nomennote(self):
        nomennote = self.nomennoteRaw or ''
        return nomennote

    @property
    def primaryimageid(self):
        imageMgiID = ""
        if (self.primaryimage):
            # use first allele assoc - data identical for this field
            imageMgiID = self.primaryimage[0].mgiid
        return imageMgiID

    @property
    def summary_mp_display(self):
        """
        mp column on allele  summary
        """
        val = ''
        if self.mp_annots:
            if len(self.mp_annots) == len([m for m in self.mp_annots if m.qualifier=='normal']):
                val = 'no abnormal phenotype observed'
            else:
                val = 'has data'
        return val  

    @property
    def vector(self):
        vector = ""
        if (self.allelecelllineassoc):
            # use first allele assoc - data identical for this field
            vector = self.allelecelllineassoc[0].allelecelllineview.vector
        return vector

    @property
    def vectortype(self):
        vectortype = ""
        if (self.allelecelllineassoc):
            # use first allele assoc - data identical for this field
            vectortype = self.allelecelllineassoc[0].allelecelllineview.vectortype
        return vectortype
    
    @property
    def genotypes_with_phenotypes(self):
        """
        Filters out any genotypes with no mp_annots
        (tip: might want to pre-load all the mp_annot objects
            with batchLoadAttribute to avoid numerous queries)
        """
        return [geno for geno in self.genotypes if geno.mp_annots]

    @classmethod
    def has_explicit_references(self):
        q = self.query.filter(Allele.explicit_references.any())
        return db.object_session(self).query(db.literal(True)) \
            .filter(q.exists()).scalar()
    
    def __repr__(self):
        return "<Allele %s>"%(self.mgiid,)
    
    
    
    
    
    
    
    
    