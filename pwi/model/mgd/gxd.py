from pwi import db,app
from pwi.model.core import *
from acc import Accession
from voc import VocTerm

class AssayType(db.Model, MGIModel):
    __tablename__ = "gxd_assaytype"
    _assaytype_key = db.Column(db.Integer, primary_key=True)
    assaytype = db.Column(db.String())
    
class AssayNote(db.Model, MGIModel):
    __tablename__ = "gxd_assaynote"
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"), primary_key=True)
    sequencenum = db.Column(db.Integer, primary_key=True)
    assaynote = db.Column(db.String())
    
    def __repr__(self):
        return self.assaynote
    
class Assay(db.Model, MGIModel):
    __tablename__ = "gxd_assay"
    _assay_key = db.Column(db.Integer, primary_key=True)
    _assaytype_key = db.Column(db.Integer, mgi_fk("gxd_assaytype._assaytype_key"))
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    _marker_key = db.Column(db.Integer, mgi_fk("mrk_marker._marker_key"))
    _reportergene_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"))
    _probeprep_key = db.Column(db.Integer, mgi_fk("gxd_probeprep._probeprep_key"))
    _antibodyprep_key = db.Column(db.Integer, mgi_fk("gxd_antibodyprep._antibodyprep_key"))

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
        backref=db.backref("assay", uselist=False))
    
    @property
    def assaynote(self):
        return "".join([n.assaynote for n in self.assaynotes])
    
    # marker backref from mrk.Marker
    # reference backref from bib.Reference
    
    def __repr__(self):
        return "<Assay %s>" % self.mgiid

    
class ADStructure(db.Model, MGIModel):
    __tablename__ = "gxd_structure"
    _structure_key = db.Column(db.Integer, primary_key=True)
    _stage_key = db.Column(db.Integer)
    printname = db.Column(db.String())
    toposort = db.Column(db.Integer)
    
    @property
    def stage(self):
        return self._stage_key
    
    def __repr__(self):
        return "TS%d: %s" % (self._stage_key, self.printname)


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
    
    
# Antibody Tables

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
    
# Probe Tables

    
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

    
# In Situ Result Tables

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
    


# InSituResult.structures = db.relationship("ADStructure",
#         primaryjoin="InSituResult._result_key==InSituResultStructure._result_key",
#         secondary=InSituResultStructure.__tablename__,
#         secondaryjoin="InSituResultStructure._structure_key==ADStructure._structure_key",
#         foreign_keys="[InSituResult._result_key, ADStructure._structure_key]",
#         backref="insituresults")
# Gel Lane tables

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
    age = db.Column(db.String())
    
    structures = db.relationship("ADStructure",
        primaryjoin="GelLane._gellane_key==GelLaneStructure._gellane_key",
        secondary=GelLaneStructure.__table__,
        secondaryjoin="GelLaneStructure._structure_key==ADStructure._structure_key",
        foreign_keys="[GelLane._gellane_key, ADStructure._structure_key]",
        backref="gellanes")
    
class GelBand(db.Model, MGIModel):
    __tablename__ = "gxd_gelband"
    _gelband_key = db.Column(db.Integer, primary_key=True)
    _gellane_key = db.Column(db.Integer, mgi_fk("gxd_gellane._gellane_key"))
    _strength_key = db.Column(db.Integer)
    
    strength = db.column_property(
        db.select([GxdStrength.strength]).
        where(GxdStrength._strength_key==_strength_key)
    )