# All models for the mrk_* tables
from pwi import db,app
from pwi.model.core import *
#from mgi import reference_assoc
#from bib import Reference
from acc import Accession
from mgi import Organism



    
# Marker.refs = db.relationship("Reference",
#     secondary=reference_assoc,
#     primaryjoin=db.and_(Marker._marker_key==reference_assoc.c._object_key,
#         reference_assoc.c._mgitype_key==2),
#     secondaryjoin=(reference_assoc.c._refs_key==Reference._refs_key),
#     foreign_keys=[Marker._marker_key,Reference._refs_key],
#     backref="markers",
#     )
    
class MarkerDetailClipNoteChunk(db.Model,MGIModel):
    __tablename__ = "mrk_notes"
    _marker_key = db.Column(db.Integer,db.ForeignKey("Marker._marker_key"),primary_key=True)
    note = db.Column(db.String())
    sequencenum = db.Column(db.Integer)

class MarkerLocationCache(db.Model,MGIModel):
    __tablename__="mrk_location_cache"
    _cache_key = db.Column(db.Integer,primary_key=True)
    _marker_key = db.Column(db.Integer,db.ForeignKey("Marker._marker_key"))
    _organism_key = db.Column(db.Integer())
    chromosome = db.Column(db.String())
    cytogeneticoffset = db.Column(db.String())
    if app.config["DBTYPE"] == "Postgres":
        cmoffset = db.Column(db.Float())
    else:
        offset = db.Column(db.Float(),key="cmoffset")
    genomicchromosome = db.Column(db.String())
    startcoordinate = db.Column(db.Float())
    endcoordinate = db.Column(db.Float())
    strand = db.Column(db.String())
    mapunits = db.Column(db.String())
    provider = db.Column(db.String())
    version = db.Column(db.String())

    @property
    def providerString(self):
        if not self.provider:
            return ""
        return "From %s annotation of %s" % (self.provider, self.version)

    def __repr__(self):
        if not self.startcoordinate or not self.endcoordinate:
            return "Chr%s" % (self.chromosome)
        
        return "Chr%s:%d-%d bp, %s strand" % (self.chromosome,
            self.startcoordinate, self.endcoordinate,
            self.strand)
    
class MarkerMCVCache(db.Model,MGIModel):
    __tablename__="mrk_mcv_cache"
    _marker_key = db.Column(db.Integer,primary_key=True)
    _mcvterm_key = db.Column(db.Integer,primary_key=True)
    term = db.Column(db.String())
    qualifier = db.Column(db.String())
    
class MarkerStatus(db.Model,MGIModel):
    __tablename__="mrk_status"
    _marker_status_key = db.Column(db.Integer,primary_key=True)
    status = db.Column(db.String())
    
class MarkerType(db.Model,MGIModel):
    __tablename__="mrk_types"
    _marker_type_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    
    
class Marker(db.Model,MGIModel):
    __tablename__="mrk_marker"
    _marker_key=db.Column(db.Integer,primary_key=True)
    _organism_key=db.Column(db.Integer())
    _organism_key.hidden=True
    _marker_type_key=db.Column(db.Integer())
    _marker_type_key.hidden=True
    _marker_status_key=db.Column(db.Integer())
    _marker_status_key.hidden=True
    symbol=db.Column(db.String())
    name=db.Column(db.String())
    chromosome=db.Column(db.String())
    cytogeneticoffset=db.Column(db.String())

    #constants
    _mgitype_key=2
    
    # joined fields
    organism = db.column_property(
                db.select([Organism.commonname]).
                where(Organism._organism_key==_organism_key)
        )  
    markertype = db.column_property(
                db.select([MarkerType.name]).
                where(MarkerType._marker_type_key==_marker_type_key)
        )  
    featuretype = db.column_property(
                db.select([MarkerMCVCache.term]).
                where(db.and_(MarkerMCVCache._marker_key==_marker_key, 
                      MarkerMCVCache.qualifier=='D'))
        )  
    markerstatus = db.column_property(
                db.select([MarkerStatus.status]).
                where(MarkerStatus._marker_status_key==_marker_status_key)
        )  

    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_marker_key)) 
    )
    
    # joined relationship
    #alleles = db.relationship("Allele",backref="marker")

    locations = db.relationship("MarkerLocationCache",
        primaryjoin="Marker._marker_key==MarkerLocationCache._marker_key",
        foreign_keys="[MarkerLocationCache._marker_key]",
           backref="marker")
    
    synonyms = db.relationship("Synonym",
        primaryjoin="and_(Marker._marker_key==Synonym._object_key, " 
                "Synonym._mgitype_key==%d)" % _mgitype_key,
        order_by="Synonym.synonym",
        foreign_keys="[Synonym._object_key]")

    detailclipchunks = db.relationship("MarkerDetailClipNoteChunk",
        primaryjoin= "MarkerDetailClipNoteChunk._marker_key==Marker._marker_key",
        order_by="MarkerDetailClipNoteChunk.sequencenum",
        foreign_keys="[MarkerDetailClipNoteChunk._marker_key]")

    @property
    def replocation(self):
        return self.locations and self.locations[0] or None

    @property
    def detailclipnote(self):
        return "".join([nc.note for nc in self.detailclipchunks])

    def __repr__(self):
        return "<Marker %s>"%self.symbol
