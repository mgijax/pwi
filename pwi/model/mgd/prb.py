# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession, AccessionReference
from mgi import Organism
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
    
    
class ProbeReferenceCache(db.Model, MGIModel):
    __tablename__ = "prb_reference"
    _reference_key = db.Column(db.Integer,primary_key=True)
    _probe_key = db.Column(db.Integer, 
        mgi_fk("prb_probe._probe_key"), 
        primary_key=True)
    _refs_key = db.Column(db.Integer, 
        mgi_fk("bib_refs._refs_key"), 
        primary_key=True)


    # constants
    _probe_mgitype_key = 3
    _sequence_logicaldb_key = 9
    
    
    # relationships
    probe_aliases = db.relationship("ProbeAlias",
        backref=db.backref("proberef", uselist=False)
        )
    probe_rflv = db.relationship("ProbeRFLV",
        backref=db.backref("proberef", uselist=False)
        )
    reference = db.relationship("Reference",
        primaryjoin="ProbeReferenceCache._refs_key==Reference._refs_key", 
        order_by="Reference.jnumid",
        foreign_keys="[Reference._refs_key]",
        uselist=False
        )
    refnotechunks = db.relationship("ProbeReferenceNotes",
        primaryjoin="ProbeReferenceCache._reference_key==ProbeReferenceNotes._reference_key",
        foreign_keys="[ProbeReferenceNotes._reference_key]",
        order_by="ProbeReferenceNotes.sequencenum"
        )
    
    
    #
    # Map sequence IDs using sqlalchemy 'non-primary mapper' strategy
    #    See: http://docs.sqlalchemy.org/en/rel_0_9/orm/join_conditions.html#relationship-to-non-primary-mapper
    #
    seqjoin = db.join(Accession, AccessionReference)
    
    seqmapper = None
    # TODO (kstone): Remove Sybase code after flip
    if app.config['DBTYPE'] == 'Sybase':
        seqmapper = db.mapper(Accession, seqjoin, non_primary=True, properties={
                "_refs_key": seqjoin.c.acc_accessionreference__refs_key,
                "_object_key": seqjoin.c.acc_accession__object_key,
                "_accession_key": [seqjoin.c.acc_accession__accession_key,seqjoin.c.acc_accessionreference__accession_key],
                "_mgitype_key": seqjoin.c.acc_accession__mgitype_key,
                "_logicaldb_key": seqjoin.c.acc_accession__logicaldb_key,
                "accid": seqjoin.c.acc_accession_accid
                }
        )
    else:
        seqmapper = db.mapper(Accession, seqjoin, non_primary=True, properties={
                "_refs_key": seqjoin.c.mgd_acc_accessionreference__refs_key,
                "_object_key": seqjoin.c.mgd_acc_accession__object_key,
                "_accession_key": [seqjoin.c.mgd_acc_accession__accession_key,seqjoin.c.mgd_acc_accessionreference__accession_key],
                "_mgitype_key": seqjoin.c.mgd_acc_accession__mgitype_key,
                "_logicaldb_key": seqjoin.c.mgd_acc_accession__logicaldb_key,
                "accid": seqjoin.c.mgd_acc_accession_accid
                }
        )
    
    sequence_accids = db.relationship(seqmapper,
        primaryjoin=db.and_(_refs_key == seqmapper.c._refs_key,
                            _probe_key == seqmapper.c._object_key,
                            seqmapper.c._mgitype_key == _probe_mgitype_key,
                            seqmapper.c._logicaldb_key == _sequence_logicaldb_key
        ),
        foreign_keys=[seqmapper.c._object_key,seqmapper.c._refs_key],
        order_by=seqmapper.c.accid
    )

    @property
    def refnote(self):
        return "".join([nc.note for nc in self.refnotechunks])

    
class ProbeAlias(db.Model, MGIModel):
    __tablename__ = "prb_alias"
    _alias_key = db.Column(db.Integer,primary_key=True)
    _reference_key = db.Column(db.Integer, 
                           mgi_fk("prb_reference._reference_key"), 
                           primary_key=True)
    alias = db.Column(db.String())

class ProbeReferenceNotes(db.Model, MGIModel):
    __tablename__ = "prb_ref_notes"
    _reference_key = db.Column(db.Integer, 
                           mgi_fk("prb_reference._reference_key"), 
                           primary_key=True)
    sequencenum = db.Column(db.Integer, primary_key=True)
    note = db.Column(db.String())

class ProbeRFLV(db.Model, MGIModel):
    __tablename__ = "prb_rflv"
    _rflv_key = db.Column(db.Integer,primary_key=True)
    _reference_key = db.Column(db.Integer, 
        mgi_fk("prb_reference._reference_key"), 
        primary_key=True)
    _marker_key = db.Column(db.Integer, 
        mgi_fk("mrk_marker._marker_key"), 
        primary_key=True)
    endonuclease = db.Column(db.String())

    # relationships
    marker = db.relationship("Marker",
        primaryjoin="ProbeRFLV._marker_key==Marker._marker_key", 
        foreign_keys="[Marker._marker_key]",
        uselist=False)

    probe_alleles = db.relationship("ProbeAllele",
        order_by="ProbeAllele.allele",
        backref=db.backref("probe", uselist=False)
        )

class ProbeAllele(db.Model, MGIModel):
    __tablename__ = "prb_allele"
    _allele_key = db.Column(db.Integer,primary_key=True)
    _rflv_key = db.Column(db.Integer, 
        mgi_fk("prb_rflv._rflv_key"), 
        primary_key=True)
    allele = db.Column(db.String())
    fragments = db.Column(db.String())
    probe_allele_strains = db.relationship("ProbeAlleleStrain",
        backref=db.backref("probe", uselist=False)
        )

class ProbeAlleleStrain(db.Model, MGIModel):
    __tablename__ = "prb_allele_strain"
    _allele_key = db.Column(db.Integer,
                            mgi_fk("prb_allele._allele_key"),
                            primary_key=True)
    _strain_key = db.Column(db.Integer(),
                           mgi_fk("prb_strain._strain_key"),
                           primary_key=True)

    strain = db.relationship("Strain",
            uselist=False) 

class ProbeTissue(db.Model,MGIModel):
    __tablename__ = "prb_tissue"
    _tissue_key = db.Column(db.Integer,primary_key=True)
    tissue = db.Column(db.String())

class Probe(db.Model,MGIModel):
    __tablename__ = "prb_probe"
    _probe_key = db.Column(db.Integer,primary_key=True)
    derivedfrom = db.Column(db.Integer, mgi_fk("prb_probe._probe_key"))
    _source_key = db.Column(db.Integer, mgi_fk("prb_source._source_key"))
    name = db.Column(db.String())
    _segmenttype_key = db.Column(db.Integer)
    _vector_key = db.Column(db.Integer)
    primer1sequence = db.Column(db.String())
    primer2sequence = db.Column(db.String())
    regioncovered = db.Column(db.String())
    insertsite = db.Column(db.String())
    insertsize = db.Column(db.String())
    productsize = db.Column(db.String())
    
    
    # constants
    _mgitype_key = 3
    
    # column properties
    
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
    
    vector = db.column_property(
            db.select([VocTerm.term]).
            where(VocTerm._term_key==_vector_key)
    )
    
    # relationships
    
    derivedfrom_probe = db.relationship("Probe", 
                primaryjoin="Probe.derivedfrom==Probe._probe_key",
                foreign_keys="[Probe._probe_key]",
                uselist=False)
    
    markers = db.relationship("Marker",
                secondary=ProbeMarkerCache.__table__,
                order_by="Marker.symbol",
                backref="probes")
    
    mgiid_object = db.relationship("Accession",
            primaryjoin="and_(Accession._object_key==Probe._probe_key,"
                            "Accession.prefixpart=='MGI:',"
                            "Accession.preferred==1,"
                            "Accession._logicaldb_key==1,"
                            "Accession._mgitype_key==%d)" % _mgitype_key,
            foreign_keys="[Accession._object_key]",
            uselist=False)
    
    other_mgiids = db.relationship("Accession",
            primaryjoin="and_(Accession.prefixpart=='MGI:',"
                        "Accession.preferred==0,"
                        "Accession._logicaldb_key==1,"
                        "Accession._object_key==Probe._probe_key,"
                        "Accession._mgitype_key==%d)" % _mgitype_key,
            foreign_keys="[Accession._object_key]",
            order_by="Accession.accid"
            )
    
    # other_accids excludes sequence DB (logicaldb_key=9)
    other_accids = db.relationship("Accession",
            primaryjoin="and_(Accession._logicaldb_key!=1,"
                        "Accession._logicaldb_key!=9,"
                        "Accession._object_key==Probe._probe_key,"
                        "Accession._mgitype_key==%d)" % _mgitype_key,
            foreign_keys="[Accession._object_key]",
            order_by="[Accession.logicaldb,Accession.accid]"
            )
    
    _probe_marker_caches = db.relationship("ProbeMarkerCache",
                        backref=db.backref("probe", uselist=False)
                    )

    _probe_reference_caches = db.relationship("ProbeReferenceCache",
        order_by="ProbeReferenceCache._refs_key",
        backref=db.backref("probe", uselist=False)
        )
    
    probenotechunks = db.relationship("ProbeNoteChunk",
        primaryjoin="ProbeNoteChunk._probe_key==Probe._probe_key",
        foreign_keys="[ProbeNoteChunk._probe_key]",
        order_by="ProbeNoteChunk.sequencenum"
    )
    
    # probepreps
    # backref defined in ProbePrep class
    
    references = db.relationship("Reference",
                secondary=ProbeReferenceCache.__table__,
                order_by="Reference._refs_key",
                backref="probes")
    
    source = db.relationship("ProbeSource")
    
    @property
    def assays(self):
        """
        requires probepreps and probeprep.assays
        to be loaded first
            (lest queries will fly)
        """
        assays = []
        for prep in self.probepreps:
            assays.extend(prep.assays)
            
        assays.sort(key=lambda a: a.mgiid)
        
        return assays
    
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
    
    @property
    def markers_with_putatives(self):
        """
        list of markers with 'is_putative' attirbute flagged
            NOTE: assumes markers and _probe_marker_caches are preloaded
                (lest the queries will fly)
        """
        putativeMarkerKeys = set([])
        for probe_assoc in self._probe_marker_caches:
            if probe_assoc.relationship == 'P':
                putativeMarkerKeys.add(probe_assoc._marker_key)
                
                
        for marker in self.markers:
            is_putative = marker._marker_key in putativeMarkerKeys
            setattr(marker, 'is_putative', is_putative)
        
        return self.markers
    
    @property
    def probenote(self):
        return "".join([nc.note for nc in self.probenotechunks])
    
    
class ProbeNoteChunk(db.Model,MGIModel):
    __tablename__ = "prb_notes"
    _probe_key = db.Column(db.Integer,db.ForeignKey("prb_probe._probe_key"),primary_key=True)
    note = db.Column(db.String())
    sequencenum = db.Column(db.Integer, primary_key=True)
    
    
class ProbeSource(db.Model,MGIModel):
    __tablename__ = "prb_source"
    _source_key = db.Column(db.Integer, primary_key=True)
    _organism_key = db.Column(db.Integer)
    _cellline_key = db.Column(db.Integer)
    _gender_key = db.Column(db.Integer)
    _refs_key = db.Column(db.Integer, mgi_fk("bib_refs._refs_key"))
    _strain_key = db.Column(db.Integer, mgi_fk("prb_strain._strain_key"))
    _tissue_key = db.Column(db.Integer)
    name = db.Column(db.String())
    description = db.Column(db.String())
    age = db.Column(db.String())
    
    # column properties
    
    cellline = db.column_property(
            db.select([VocTerm.term]).
            where(VocTerm._term_key==_cellline_key)
    ) 
    
    gender = db.column_property(
            db.select([VocTerm.term]).
            where(VocTerm._term_key==_gender_key)
    ) 
    
    organism = db.column_property(
            db.select([Organism.commonname]).
            where(Organism._organism_key==_organism_key)
    ) 
    
    tissue = db.column_property(
            db.select([ProbeTissue.tissue]).
            where(ProbeTissue._tissue_key==_tissue_key)
    )
    
    # relationships
    
    reference = db.relationship("Reference",
            uselist=False)
    
    strain = db.relationship("Strain",
            uselist=False) 
    
class Strain(db.Model,MGIModel):
    __tablename__ = "prb_strain"
    _strain_key = db.Column(db.Integer,primary_key=True)
    strain = db.Column(db.String())

    # alleles
    # alleles backref defined in Allele class
    