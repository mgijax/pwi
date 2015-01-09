"""
GXD tables are organized by groups

1) genotype tables
2) assay tables
3) antibody tables
4) probe tables
5) insitu tables
6) gellane tables

Tables in each group are in alpha order if possible, 
but column property tables must appear first

"""

from pwi import db,app
from pwi.model.core import *
from acc import Accession
from img import ImagePaneAssoc
from mgi import Note, NoteChunk
from mrk import Marker
from prb import Strain
from voc import VocTerm


### Views ###
class AssayAlleleView(db.Model, MGIModel):
    """
    Association view between assay and allele
    """
    __tablename__ = "gxd_assay_allele_view"
    _assay_key = db.Column(db.Integer, 
                           mgi_fk("gxd_assay._assay_key"),
                           primary_key=True)
    _allele_key = db.Column(db.Integer, 
                            mgi_fk("all_allele._allele_key"), 
                            primary_key=True)


### genotype tables ##

class AlleleGenotype(db.Model, MGIModel):
    __tablename__ = "gxd_allelegenotype"
    _genotype_key = db.Column(db.Integer, mgi_fk("gxd_genotype._genotype_key"), primary_key=True)
    _allele_key = db.Column(db.Integer, mgi_fk("all_allele._allele_key"), primary_key=True)
    _marker_key = db.Column(db.Integer, mgi_fk("mrk_marker._marker_key"))
    sequencenum = db.Column(db.Integer)
    
    

class AllelePair(db.Model, MGIModel):
    __tablename__ = "gxd_allelepair"
    _allelepair_key = db.Column(db.Integer, primary_key=True)
    _genotype_key = db.Column(db.Integer, mgi_fk("gxd_genotype._genotype_key"))
    _allele_key_1 = db.Column(db.Integer, mgi_fk("all_allele._allele_key"))
    _allele_key_2 = db.Column(db.Integer, mgi_fk("all_allele._allele_key"))
    _marker_key = db.Column(db.Integer, mgi_fk("mrk_marker._marker_key"))
    _pairstate_key = db.Column(db.Integer)
    sequencenum = db.Column(db.Integer)
    
    chromosome = db.column_property(
        db.select([Marker.chromosome]).
        where(Marker._marker_key==_marker_key)   
    )
    
    pairstate = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_pairstate_key)
    )
    
    # relationships
    
    allele1 = db.relationship("Allele",
        primaryjoin="Allele._allele_key==AllelePair._allele_key_1",
        uselist=False)
    
    allele2 = db.relationship("Allele",
        primaryjoin="Allele._allele_key==AllelePair._allele_key_2",
        uselist=False)
    
    @property
    def display(self):
        """
        displays allele 1 and 2 symbols 
        exactly as they are, without combination logic
        """
        sym1 = self.allele1.symbol
        sym2 = ''
        if self.allele2:
            sym2 = self.allele2.symbol
        return "%s / %s" % (sym1, sym2)
    
    def __repr__(self):
        return self.display

class Genotype(db.Model, MGIModel):
    __tablename__ = "gxd_genotype"
    _genotype_key = db.Column(db.Integer, primary_key=True)
    _strain_key = db.Column(db.Integer, mgi_fk("prb_strain._strain_key"))
    isconditional = db.Column(db.Integer)
    note = db.Column(db.String())
    
    # constants
    _mgitype_key = 12
    comb1_notetype_key = 1016
    _mp_annottype_key = 1002
    _disease_geno_anottype_key = 1005
    
    # combination1 is a cache loaded note
    combination1_cache = db.column_property(
        db.select([NoteChunk.note]).
        where(db.and_(Note._note_key==NoteChunk._note_key,
                     NoteChunk.sequencenum==1,
                     Note._object_key==_genotype_key,
                     Note._mgitype_key==_mgitype_key,
                     Note._notetype_key==comb1_notetype_key)
        )
    )
    
    geneticbackground = db.column_property(
        db.select([Strain.strain]).
        where(Strain._strain_key==_strain_key)
    )
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_genotype_key)) 
    )
    
    # relationships
    
    allelepairs = db.relationship("AllelePair",
            order_by="AllelePair.sequencenum")
    
    mp_annots = db.relationship("VocAnnot",
            primaryjoin="and_(VocAnnot._object_key==Genotype._genotype_key,"
                        "VocAnnot._annottype_key==%d)" % _mp_annottype_key,
            foreign_keys="[VocAnnot._object_key]")
          
    disease_annots = db.relationship("VocAnnot",
            primaryjoin="and_(VocAnnot._object_key==Genotype._genotype_key,"
                        "VocAnnot._annottype_key==%d)" % _disease_geno_anottype_key,
            foreign_keys="[VocAnnot._object_key]")
    
    
    primaryimagepane = db.relationship("ImagePane",
            primaryjoin="and_(Genotype._genotype_key==ImagePaneAssoc._object_key,"
                        "ImagePaneAssoc.isprimary==1,"
                        "ImagePaneAssoc._mgitype_key==%d)" % _mgitype_key,
            secondary=ImagePaneAssoc.__table__,
            secondaryjoin="ImagePaneAssoc._imagepane_key==ImagePane._imagepane_key",
            foreign_keys="[ImagePaneAssoc._object_key,ImagePaneAssoc._imagepane_key]",
            uselist=False)
    
    def __init__(self):
        # add any non-database attribute defaults
        self.mp_headers = []
    
    @db.reconstructor
    def init_on_load(self):
        self.__init__()
        
        
    

### assay tables ###

class ADStructure(db.Model, MGIModel):
    __tablename__ = "gxd_structure"
    _structure_key = db.Column(db.Integer, primary_key=True)
    _stage_key = db.Column(db.Integer)
    printname = db.Column(db.String())
    toposort = db.Column(db.Integer)
    
    @property
    def stage(self):
        return self._stage_key
    
    @property
    def display(self):
        return "TS%s: %s" % (self.stage, self.printname)
    
    def __repr__(self):
        return self.display()
    
class AssayNote(db.Model, MGIModel):
    __tablename__ = "gxd_assaynote"
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"), primary_key=True)
    sequencenum = db.Column(db.Integer, primary_key=True)
    assaynote = db.Column(db.String())
    
    def __repr__(self):
        return self.assaynote
    
class AssayType(db.Model, MGIModel):
    __tablename__ = "gxd_assaytype"
    _assaytype_key = db.Column(db.Integer, primary_key=True)
    assaytype = db.Column(db.String())

class Assay(db.Model, MGIModel):
    __tablename__ = "gxd_assay"
    _assay_key = db.Column(db.Integer, primary_key=True)
    _assaytype_key = db.Column(db.Integer, mgi_fk("gxd_assaytype._assaytype_key"))
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    _marker_key = db.Column(db.Integer, mgi_fk("mrk_marker._marker_key"))
    _reportergene_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    _probeprep_key = db.Column(db.Integer, mgi_fk("gxd_probeprep._probeprep_key"))
    _antibodyprep_key = db.Column(db.Integer, mgi_fk("gxd_antibodyprep._antibodyprep_key"))
    _imagepane_key = db.Column(db.Integer, mgi_fk("img_imagepane._imagepane_key"))

    # constants
    
    _mgitype_key=8
    
    # column properties
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_assay_key)) 
    )
    
    reportergene = db.column_property(
        db.select([VocTerm.term]).
        where(VocTerm._term_key==_reportergene_key)
    )

    assaytype = db.column_property(
        db.select([AssayType.assaytype]).
        where(AssayType._assaytype_key==_assaytype_key)
    )  

    # Relationships
    
    alleles = db.relationship("Allele",
                secondary=AssayAlleleView.__table__,
                backref="assays")
    
    probeprep = db.relationship("ProbePrep", uselist=False)
    antibodyprep = db.relationship("AntibodyPrep", uselist=False)
    assaynotes = db.relationship("AssayNote", order_by="AssayNote.sequencenum")
    
    
    specimens = db.relationship("Specimen",  
        primaryjoin="Assay._assay_key==Specimen._assay_key",
        foreign_keys="[Specimen._assay_key]",
        order_by="Specimen.sequencenum",
        backref=db.backref("assay", uselist=False))
    
    gellanes = db.relationship("GelLane",  
        primaryjoin="Assay._assay_key==GelLane._assay_key",
        foreign_keys="[GelLane._assay_key]",
        order_by="GelLane.sequencenum",
        backref=db.backref("assay", uselist=False))
    
    gellane_imagepane = db.relationship("ImagePane", uselist=False)
    
    gelrows = db.relationship("GelRow",
            order_by="GelRow.sequencenum")
    
    @property
    def assaynote(self):
        return "".join([n.assaynote for n in self.assaynotes])
    
    @property
    def gellanes_with_agenotes(self):
        gellanes = []
        for gellane in self.gellanes:
            if gellane.agenote:
                gellanes.append(gellane)
        return gellanes
    
    @property
    def gelrows_with_rownotes(self):
        gelrows = []
        for gelrow in self.gelrows:
            if gelrow.rownote:
                gelrows.append(gelrow)
        return gelrows
    
    @property
    def gelbands_with_bandnotes(self):
        gelbands = []
        for gellane in self.gellanes:
            for gelband in gellane.gelbands:
                if gelband.bandnote:
                    gelbands.append(gelband)
        return gelbands
    
    
    # marker backref from mrk.Marker
    # reference backref from bib.Reference
    
    def __repr__(self):
        return "<Assay %s>" % self.mgiid


class GxdLabel(db.Model, MGIModel):
    """
    Label for ProbePrep + AntibodyPrep
    """
    __tablename__ = "gxd_label"
    _label_key = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String())
    
class GxdPattern(db.Model, MGIModel):
    __tablename__ = "gxd_pattern"
    _pattern_key = db.Column(db.Integer, primary_key=True)
    pattern = db.Column(db.String())
    
class GxdStrength(db.Model, MGIModel):
    __tablename__ = "gxd_strength"
    _strength_key = db.Column(db.Integer, primary_key=True)
    strength = db.Column(db.String())
    
    
### Antibody Tables ##

class Antibody(db.Model, MGIModel):
    __tablename__ = "gxd_antibody"
    _antibody_key = db.Column(db.Integer, primary_key=True)
    antibodyname = db.Column(db.String())
    
class GxdSecondary(db.Model, MGIModel):
    __tablename__ = "gxd_secondary"
    _secondary_key = db.Column(db.Integer, primary_key=True)
    secondary = db.Column(db.String())
    
class AntibodyPrep(db.Model, MGIModel):
    __tablename__ = "gxd_antibodyprep"
    _antibodyprep_key = db.Column(db.Integer, primary_key=True)
    _antibody_key = db.Column(db.Integer, mgi_fk("gxd_antibody._antibody_key"))
    _secondary_key = db.Column(db.Integer)
    _label_key = db.Column(db.Integer)

    label = db.column_property(
        db.select([GxdLabel.label]).
        where(GxdLabel._label_key==_label_key)
    )
    
    secondary = db.column_property(
        db.select([GxdSecondary.secondary]).
        where(GxdSecondary._secondary_key==_secondary_key)
    )
    
    # Relationships
    
    antibody = db.relationship("Antibody")
    
    
### Probe Tables ###
    
class ProbeSense(db.Model, MGIModel):
    """
    Sense for ProbePrep
    """
    __tablename__ = "gxd_probesense"
    _sense_key = db.Column(db.Integer, primary_key=True)
    sense = db.Column(db.String())
    
class VisualizationMethod(db.Model, MGIModel):
    """
    Visualization Method for ProbePrep
    """
    __tablename__ = "gxd_visualizationmethod"
    _visualization_key = db.Column(db.Integer, primary_key=True)
    visualization = db.Column(db.String())
    
    
class ProbePrep(db.Model, MGIModel):
    __tablename__ = "gxd_probeprep"
    _probeprep_key = db.Column(db.Integer, primary_key=True)
    _probe_key = db.Column(db.Integer, mgi_fk("prb_probe._probe_key"))
    _sense_key = db.Column(db.Integer)
    _label_key = db.Column(db.Integer)
    _visualization_key = db.Column(db.Integer)
    type = db.Column(db.String())
    
    
    label = db.column_property(
        db.select([GxdLabel.label]).
        where(GxdLabel._label_key==_label_key)
    )
    
    sense = db.column_property(
        db.select([ProbeSense.sense]).
        where(ProbeSense._sense_key==_sense_key)
    )
    
    visualization = db.column_property(
        db.select([VisualizationMethod.visualization]).
        where(VisualizationMethod._visualization_key==_visualization_key)
    )
    
    # Relationships
    
    probe = db.relationship("Probe")

    
### In Situ Result Tables ###

class EmbeddingMethod(db.Model, MGIModel):
    """
    Embedding Method for Specimen
    """
    __tablename__ = "gxd_embeddingmethod"
    _embedding_key = db.Column(db.Integer, primary_key=True)
    embeddingmethod = db.Column(db.String())
    
class FixationMethod(db.Model, MGIModel):
    """
    Fixation Method for Specimen
    """
    __tablename__ = "gxd_fixationmethod"
    _fixation_key = db.Column(db.Integer, primary_key=True)
    fixation = db.Column(db.String())

class Specimen(db.Model, MGIModel):
    __tablename__ = "gxd_specimen"
    _specimen_key = db.Column(db.Integer, primary_key=True)
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"))
    _genotype_key = db.Column(db.Integer, mgi_fk("gxd_genotype._genotype_key"))
    age = db.Column(db.String())
    agenote = db.Column(db.String())
    hybridization = db.Column(db.String())
    sex = db.Column(db.String())
    specimenlabel = db.Column(db.String())
    specimennote = db.Column(db.String())
    sequencenum = db.Column(db.Integer)
    _embedding_key = db.Column(db.Integer)
    _fixation_key = db.Column(db.Integer)
    
    embeddingmethod = db.column_property(
        db.select([EmbeddingMethod.embeddingmethod]).
        where(EmbeddingMethod._embedding_key==_embedding_key)
    )
    
    fixation = db.column_property(
        db.select([FixationMethod.fixation]).
        where(FixationMethod._fixation_key==_fixation_key)
    )
    
    insituresults = db.relationship("InSituResult", 
        primaryjoin="InSituResult._specimen_key==Specimen._specimen_key",
        foreign_keys="[InSituResult._specimen_key]",
        order_by="InSituResult.sequencenum",
        backref=db.backref("specimen", uselist=False))
    
    genotype = db.relationship("Genotype", uselist=False)
    
    @property
    def imagepanes(self):
        panes = []
        seen = set()
        if self.insituresults:
            for result in self.insituresults:
                for pane in result.imagepanes:
                    if pane not in seen:
                        panes.append(pane)
                        seen.add(pane)
        return panes


class InSituResultStructure(db.Model, MGIModel):
    __tablename__ = "gxd_isresultstructure"
    _result_key = db.Column(db.Integer, mgi_fk("gxd_insituresult._result_key"), 
            primary_key=True)
    _structure_key = db.Column(db.Integer, mgi_fk("gxd_structure._structure_key"), 
            primary_key=True)
    
class InSituResultImagePane(db.Model, MGIModel):
    __tablename__ = "gxd_insituresultimage"
    _result_key = db.Column(db.Integer, mgi_fk("gxd_insituresult._result_key"), 
            primary_key=True)
    _imagepane_key = db.Column(db.Integer, mgi_fk("img_imagepane._imagepane_key"), 
            primary_key=True)
    
class InSituResult(db.Model, MGIModel):
    __tablename__ = "gxd_insituresult"
    _result_key = db.Column(db.Integer, primary_key=True)
    _specimen_key = db.Column(db.Integer, mgi_fk("gxd_specimen._specimen_key"))
    _strength_key = db.Column(db.Integer)
    _pattern_key = db.Column(db.Integer)
    sequencenum = db.Column(db.Integer)
    resultnote = db.Column(db.String())
    
    pattern = db.column_property(
        db.select([GxdPattern.pattern]).
        where(GxdPattern._pattern_key==_pattern_key)
    )
    
    strength = db.column_property(
        db.select([GxdStrength.strength]).
        where(GxdStrength._strength_key==_strength_key)
    )
    
    # Relationships
    
    imagepanes = db.relationship("ImagePane",
            secondary=InSituResultImagePane.__table__,
            backref="insituresults")
    
    structures = db.relationship("ADStructure",
            secondary=InSituResultStructure.__table__,
            order_by="ADStructure.toposort",
            backref="insituresults")
    


### Gel Lane Tables ###

class GelControl(db.Model, MGIModel):
    __tablename__ = "gxd_gelcontrol"
    _gelcontrol_key = db.Column(db.Integer, primary_key=True)
    gellanecontent = db.Column(db.String())
    
class GelRnaType(db.Model, MGIModel):
    __tablename__ = "gxd_gelrnatype"
    _gelrnatype_key = db.Column(db.Integer, primary_key=True)
    rnatype = db.Column(db.String())

class GelLaneStructure(db.Model, MGIModel):
    __tablename__ = "gxd_gellanestructure"
    _gellane_key = db.Column(db.Integer, mgi_fk("gxd_gellane._gellane_key"), 
            primary_key=True)
    _structure_key = db.Column(db.Integer, mgi_fk("gxd_structure._structure_key"), 
            primary_key=True)
    
class GelLane(db.Model, MGIModel):
    __tablename__ = "gxd_gellane"
    _gellane_key = db.Column(db.Integer, primary_key=True)
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"))
    _gelcontrol_key = db.Column(db.Integer, mgi_fk("gxd_gelcontrol"))
    _genotype_key = db.Column(db.Integer, mgi_fk("gxd_genotype._genotype_key"))
    _gelrnatype_key = db.Column(db.Integer)
    sequencenum = db.Column(db.Integer)
    age = db.Column(db.String())
    agenote = db.Column(db.String())
    lanelabel = db.Column(db.String())
    lanenote = db.Column(db.String())
    sampleamount = db.Column(db.String())
    sex = db.Column(db.String())
    
    controlcontent = db.column_property(
        db.select([GelControl.gellanecontent]).
        where(GelControl._gelcontrol_key==_gelcontrol_key)
    )
    
    rnatype = db.column_property(
        db.select([GelRnaType.rnatype]).
        where(GelRnaType._gelrnatype_key==_gelrnatype_key)
    )
    
    # relationships
    
    gelbands = db.relationship("GelBand",
            order_by="GelBand.gelrow_sequencenum",
            backref=db.backref("gellane", uselist=False))
    
    structures = db.relationship("ADStructure",
        primaryjoin="GelLane._gellane_key==GelLaneStructure._gellane_key",
        secondary=GelLaneStructure.__table__,
        secondaryjoin="GelLaneStructure._structure_key==ADStructure._structure_key",
        foreign_keys="[GelLane._gellane_key, ADStructure._structure_key]",
        backref="gellanes")
    
    genotype = db.relationship("Genotype",
            uselist=False)
    
    @property
    def lanelabel_display(self):
        return self.lanelabel or 'Lane %s' % self.sequencenum
    
    @property
    def iscontrol(self):
        return self._gelcontrol_key != 1
    
class GelUnits(db.Model, MGIModel):
    __tablename__ = "gxd_gelunits"
    _gelunits_key = db.Column(db.Integer, primary_key=True)
    units = db.Column(db.String())

class GelRow(db.Model, MGIModel):
    __tablename__ = "gxd_gelrow"
    _gelrow_key = db.Column(db.Integer, primary_key=True)
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"))
    _gelunits_key = db.Column(db.Integer)
    sequencenum = db.Column(db.Integer)
    rownote = db.Column(db.String())
    size = db.Column(db.Float())
    
    gelunits = db.column_property(
        db.select([GelUnits.units]).
        where(GelUnits._gelunits_key==_gelunits_key)
    )
    
    @property
    def size_and_units(self):
        return "%s %s" % (self.size, self.gelunits)
    
class GelBand(db.Model, MGIModel):
    __tablename__ = "gxd_gelband"
    _gelband_key = db.Column(db.Integer, primary_key=True)
    _gelrow_key = db.Column(db.Integer, mgi_fk("gxd_gelrow._gelrow_key"))
    _gellane_key = db.Column(db.Integer, mgi_fk("gxd_gellane._gellane_key"))
    _strength_key = db.Column(db.Integer)
    bandnote = db.Column(db.String())
    
    strength = db.column_property(
        db.select([GxdStrength.strength]).
        where(GxdStrength._strength_key==_strength_key)
    )
    
    gelrow_sequencenum = db.column_property(
        db.select([GelRow.sequencenum]).
        where(GelRow._gelrow_key==_gelrow_key)
    )
    
    gelrow = db.relationship("GelRow", uselist=False)
    
