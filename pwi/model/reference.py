# ORM representation of BIB_Ref object
# includes other reference related tables
from pwi import db,app
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from core import *

class Accession(db.Model,MGIModel):
	__tablename__ = "acc_accession"
	_accession_key = db.Column(db.Integer,primary_key=True)
	accid = db.Column(db.String())
	prefixpart = db.Column(db.String())
	numericpart = db.Column(db.Integer())
	_logicaldb_key = db.Column(db.Integer())
	_object_key = db.Column(db.Integer())
	_mgitype_key = db.Column(db.Integer())
	private = db.Column(db.Integer())
	preferred = db.Column(db.Integer())
	
	def __repr__(self):
		return "<AccID %s>"%(self.accid,)

class NoteChunk(db.Model,MGIModel):
	__tablename__ = "mgi_notechunk"
	_note_key = db.Column(db.Integer,db.ForeignKey("Note._note_key"),primary_key=True)
	sequencenum = db.Column(db.Integer,primary_key=True)
	note = db.Column(db.String())

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
                db.select([NoteType.notetype]). \
                where(NoteType._notetype_key==_notetype_key)
        )  

	chunks = db.relationship("NoteChunk",
		primaryjoin="Note._note_key==NoteChunk._note_key",
		foreign_keys=[NoteChunk._note_key],
		order_by="NoteChunk.sequencenum")

	@property
	def text(self):
		return "".join(self.chunks)

class MarkerDetailClipNoteChunk(db.Model,MGIModel):
	__tablename__ = "mrk_notes"
	_marker_key = db.Column(db.Integer,db.ForeignKey("Marker._marker_key"),primary_key=True)
	note = db.Column(db.String())
	sequencenum = db.Column(db.Integer)

class Organism(db.Model,MGIModel):
	__tablename__="mgi_organism"
	_organism_key = db.Column(db.Integer,primary_key=True)
	commonname = db.Column(db.String())
class MarkerType(db.Model,MGIModel):
	__tablename__="mrk_types"
	_marker_type_key = db.Column(db.Integer,primary_key=True)
	name = db.Column(db.String())
class MarkerStatus(db.Model,MGIModel):
	__tablename__="mrk_status"
	_marker_status_key = db.Column(db.Integer,primary_key=True)
	status = db.Column(db.String())
class MarkerMCVCache(db.Model,MGIModel):
	__tablename__="mrk_mcv_cache"
	_marker_key = db.Column(db.Integer,primary_key=True)
	_mcvterm_key = db.Column(db.Integer,primary_key=True)
	term = db.Column(db.String())
	qualifier = db.Column(db.String())

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
		return "From %s annotation of %s" % (self.provider, self.version)

	def __repr__(self):
		return "Chr%s:%d-%d bp, %s strand" % (self.chromosome,
			self.startcoordinate, self.endcoordinate,
			self.strand)

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
                db.select([Organism.commonname]). \
                where(Organism._organism_key==_organism_key)
        )  
	markertype = db.column_property(
                db.select([MarkerType.name]). \
                where(MarkerType._marker_type_key==_marker_type_key)
        )  
	featuretype = db.column_property(
                db.select([MarkerMCVCache.term]). \
                where(db.and_(MarkerMCVCache._marker_key==_marker_key, \
			MarkerMCVCache.qualifier=='D'))
        )  
	markerstatus = db.column_property(
                db.select([MarkerStatus.status]). \
                where(MarkerStatus._marker_status_key==_marker_status_key)
        )  

	mgiid = db.column_property(
		db.select([Accession.accid]). \
		where(db.and_(Accession._mgitype_key==_mgitype_key, \
			Accession.prefixpart=='MGI:', \
			Accession.preferred==1, \
			Accession._logicaldb_key==1, \
			Accession._object_key==_marker_key)) \
	)

	mgiid = db.column_property(
		db.select([Accession.accid]). \
		where(db.and_(Accession._mgitype_key==_mgitype_key, \
			Accession.prefixpart=='MGI:', \
			Accession.preferred==1, \
			Accession._logicaldb_key==1, \
			Accession._object_key==_marker_key)) \
	)

	# joined relationship
	#alleles = db.relationship("Allele",backref="marker")

	locations = db.relationship("MarkerLocationCache",
		primaryjoin="Marker._marker_key==MarkerLocationCache._marker_key",
		foreign_keys=[MarkerLocationCache._marker_key],
	   	backref="marker")

	detailclipchunks = db.relationship("MarkerDetailClipNoteChunk",
		primaryjoin= "MarkerDetailClipNoteChunk._marker_key==Marker._marker_key",
		order_by="MarkerDetailClipNoteChunk.sequencenum",
		foreign_keys=[MarkerDetailClipNoteChunk._marker_key])

	@property
	def replocation(self):
		return self.locations and self.locations[0] or None

	@property
	def detailclipnote(self):
		return "".join([nc.note for nc in self.detailclipchunks])

	def __repr__(self):
		return "<Marker %s>"%self.symbol


class ReviewStatus(db.Model,MGIModel):
	__tablename__="bib_reviewstatus"
	_reviewstatus_key = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String())

class Reference(db.Model,MGIModel):
	__tablename__ = "bib_refs"
	_refs_key = db.Column(db.Integer, primary_key=True)
	_reviewstatus_key = db.Column(db.Integer())
	# hide the join key from views
	_reviewstatus_key.hidden=True
	reftype = db.Column(db.String())
	authors = db.Column(db.String())
	_primary = db.Column(db.String())
	title = db.Column(db.String())
	# this is a way to fix unicode.decode errors, but has a slight performance cost
	#abstract = db.Column(db.String(convert_unicode='force',unicode_error="ignore"))
	abstract = db.Column(db.String())
	journal = db.Column(db.String())
	year = db.Column(db.Integer())
	date = db.Column(db.Integer())
	#date.quote=False
	vol = db.Column(db.Integer())
	issue = db.Column(db.Integer())
	pgs = db.Column(db.Integer())
	
	# constants
	_mgitype_key=1	

	# mapped columns
	jnumid = db.column_property(
		db.select([Accession.accid]). \
		where(db.and_(Accession._mgitype_key==_mgitype_key, \
			Accession.prefixpart=='J:', \
			Accession._object_key==_refs_key)) \
	)
	reviewstatus = db.column_property(
		db.select([ReviewStatus.name]). \
		where(ReviewStatus._reviewstatus_key==_reviewstatus_key)
	)
	
	@property
	def citation(self):
		return "%s, %s, %s %s;%s(%s):%s"% \
			(self.authors,self.title,self.journal, \
			self.date,self.vol,self.issue,self.pgs)

	def __repr__(self):
		return "<Reference %s,%s>"%(self.title,self.authors)


# define the association table for references
# this is used in defining join relationships
reference_assoc = mgi_table('mgi_reference_assoc',
	db.Column('_object_key',db.Integer()),
	db.Column('_refs_key',db.Integer,db.ForeignKey('bib_refs._refs_key')),
	db.Column('_mgitype_key',db.Integer()),
)

Marker.refs = db.relationship("Reference",
	secondary=reference_assoc,
	primaryjoin=db.and_(Marker._marker_key==reference_assoc.c._object_key,
		reference_assoc.c._mgitype_key==2),
	secondaryjoin=(reference_assoc.c._refs_key==Reference._refs_key),
	foreign_keys=[Marker._marker_key,Reference._refs_key],
	backref="markers",
	)

