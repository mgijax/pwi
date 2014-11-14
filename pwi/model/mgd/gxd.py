from pwi import db,app
from pwi.model.core import *
from acc import Accession
from voc import VocTerm

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
    
    specimens = db.relationship("Specimen",  
        primaryjoin="Assay._assay_key==Specimen._assay_key",
        foreign_keys="[Specimen._assay_key]",
        backref=db.backref("assay", uselist=False))
    
    gellanes = db.relationship("GelLane",  
        primaryjoin="Assay._assay_key==GelLane._assay_key",
        foreign_keys="[GelLane._assay_key]",
        backref=db.backref("assay", uselist=False))
    
    # marker backref from mrk.Marker
    # reference backref from bib.Reference
    
    def __repr__(self):
        return "<Assay %s>" % self.mgiid

    
class ADStructure(db.Model, MGIModel):
    __tablename__ = "gxd_structure"
    _structure_key = db.Column(db.Integer, primary_key=True)
    _stage_key = db.Column(db.Integer)
    printname = db.Column(db.String())
    
    @property
    def stage(self):
        return self._stage_key
    
    def __repr__(self):
        return "TS%d: %s" % (self._stage_key, self.printname)
    
class GxdStrength(db.Model, MGIModel):
    __tablename__ = "gxd_strength"
    _strength_key = db.Column(db.Integer, primary_key=True)
    strength = db.Column(db.String())
    

# In Situ Result Tables

class Specimen(db.Model, MGIModel):
    __tablename__ = "gxd_specimen"
    _specimen_key = db.Column(db.Integer, primary_key=True)
    _assay_key = db.Column(db.Integer, mgi_fk("gxd_assay._assay_key"))
    age = db.Column(db.String())
    
    insituresults = db.relationship("InSituResult", 
        primaryjoin="InSituResult._specimen_key==Specimen._specimen_key",
        foreign_keys="[InSituResult._specimen_key]",
        backref=db.backref("specimen", uselist=False))


class InSituResultStructure(db.Model, MGIModel):
    __tablename__ = "gxd_isresultstructure"
    _result_key = db.Column(db.Integer, mgi_fk("gxd_insituresult._result_key"), 
            primary_key=True)
    _structure_key = db.Column(db.Integer, mgi_fk("gxd_structure._structure_key"), 
            primary_key=True)
    
class InSituResult(db.Model, MGIModel):
    __tablename__ = "gxd_insituresult"
    _result_key = db.Column(db.Integer, primary_key=True)
    _specimen_key = db.Column(db.Integer, mgi_fk("gxd_specimen._specimen_key"))
    _strength_key = db.Column(db.Integer)
    
    strength = db.column_property(
        db.select([GxdStrength.strength]).
        where(GxdStrength._strength_key==_strength_key)
    )
    


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