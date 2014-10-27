# ORM representation of BIB_Ref object
# includes other reference related tables
from pwi import db,app
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from core import *
from reference import reference_assoc,Reference,Accession

class Strain(db.Model,MGIModel):
	__tablename__="prb_strain"
        _strain_key=db.Column(db.Integer,primary_key=True)
	strain = db.Column(db.String())

class Allele(db.Model,MGIModel):
        __tablename__="all_allele"
        _allele_key=db.Column(db.Integer,primary_key=True)
	_marker_key=db.Column(db.Integer,mgi_fk('mrk_marker._marker_key'))
	_strain_key = db.Column(db.Integer,mgi_fk('prb_strain._strain_key'))	
	# hide ths key from query summary
	_strain_key.hidden=True
	symbol = db.Column(db.String())
	name = db.Column(db.String())
	nomensymbol = db.Column(db.String())
	iswildtype= db.Column(db.Integer())
	ismixed= db.Column(db.Integer())

	# two different ways of joining
	# first way gets entire object
	strainObj = db.relationship("Strain",backref=db.backref("allele",uselist=False))
	# this way gets just one column fom the given object
	strain = db.column_property(
                db.select([Strain.strain]). \
                where(Strain._strain_key==_strain_key)
        )   

	#constants
	_mgitype_key=11

	mgiid = db.column_property(
                db.select([Accession.accid]). \
                where(db.and_(Accession._mgitype_key==_mgitype_key, \
                        Accession.prefixpart=='MGI:', \
                        Accession.preferred==1, \
                        Accession._logicaldb_key==1, \
                        Accession._object_key==_marker_key)) \
        )   
	def __repr__(self):
		return "<%s: %s>"%(self.symbol,self.mgiid)

Allele.refs = db.relationship("Reference",
        secondary=reference_assoc,
        primaryjoin=db.and_(Allele._allele_key==reference_assoc.c._object_key,
                reference_assoc.c._mgitype_key==11),
        secondaryjoin=(reference_assoc.c._refs_key==Reference._refs_key),
        foreign_keys=[Allele._allele_key,Reference._refs_key],
        backref="alleles",
        )   

