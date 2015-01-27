# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from voc import VocTerm


class ProbeMarkerCache(db.Model, MGIModel):
    __tablename__ = "prb_marker"
    _probe_key = db.Column(db.Integer, 
                           mgi_fk("prb_probe._probe_key"), 
                           primary_key=True)
    _marker_key = db.Column(db.Integer, 
                            mgi_fk("mrk_marker._marker_key"), 
                            primary_key=True)
    _refs_key = db.Column(db.Integer, 
                          mgi_fk("bib_refs._refs_key"), 
                          primary_key=True)
    relationship = db.Column(db.String())

class Probe(db.Model,MGIModel):
    __tablename__ = "prb_probe"
    _probe_key = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String())
    _segmenttype_key = db.Column(db.Integer)
    
    _mgitype_key = 3
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_probe_key)) 
    )
    
    segmenttype = db.column_property(
                db.select([VocTerm.term]).
                where(VocTerm._term_key==_segmenttype_key)
        ) 
    
    
    markers = db.relationship("Marker",
                secondary=ProbeMarkerCache.__table__,
                order_by="Marker.symbol",
                backref="probes")
    
    _probe_marker_caches = db.relationship("ProbeMarkerCache",
                        backref=db.backref("probe", uselist=False)
                    )
    
    references = db.relationship("Reference",
                secondary=ProbeMarkerCache.__table__,
                order_by="Reference._refs_key",
                backref="probes")
    
    @property
    def chromosome(self):
        """
        return chromosome of first marker
        """
        chr = ''
        if self.markers:
            chr = self.markers[0].chromosome
        return chr
    
    @property
    def marker_symbols_with_putatives(self):
        """
        list of marker symbols with putatives flagged
            NOTE: assumes markers and _probe_marker_caches are preloaded
                (lest the queries will fly)
        """
        putativeMarkerKeys = set([])
        symbols = []
        for probe_assoc in self._probe_marker_caches:
            if probe_assoc.relationship == 'P':
                putativeMarkerKeys.add(probe_assoc._marker_key)
                
                
        for marker in self.markers:
            symbol = marker.symbol
            if marker._marker_key in putativeMarkerKeys:
                symbol += ' (PUTATIVE)'
            
            symbols.append(symbol)
            
        symbols.sort()
        
        return symbols
    
    
class Strain(db.Model,MGIModel):
    __tablename__ = "prb_strain"
    _strain_key = db.Column(db.Integer,primary_key=True)
    strain = db.Column(db.String())
    # REST TO BE FILLED AS NEEDED
    
    # alleles
    # alleles backref defined in Allele class
    