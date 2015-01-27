# All models for the bib_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession 


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
    abstract = db.Column(db.String(convert_unicode='force',unicode_error="ignore"))
    #abstract = db.Column(db.String())
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
    #jnumid = db.Column(db.String())
    jnumid = db.column_property(
        db.select([Accession.accid]). \
        where(db.and_(Accession._mgitype_key==_mgitype_key, 
            Accession.prefixpart=='J:', 
            Accession._object_key==_refs_key)) 
    )
    #pubmedid = db.Column(db.String())
    pubmedid = db.column_property(
         db.select([Accession.accid]). \
         where(db.and_(Accession._mgitype_key==_mgitype_key, 
             Accession._logicaldb_key==29, 
             Accession._object_key==_refs_key)) 
     )
    reviewstatus = db.column_property(
        db.select([ReviewStatus.name]). \
        where(ReviewStatus._reviewstatus_key==_reviewstatus_key)
    )
    
    # Relationships
    jnumid_object = db.relationship("Accession",
                    primaryjoin="and_(Accession._object_key==Reference._refs_key,"
                                    "Accession.prefixpart=='J:',"
                                    "Accession.preferred==1,"
                                    "Accession._logicaldb_key==1,"
                                    "Accession._mgitype_key==%d)" % _mgitype_key,
                    foreign_keys="[Accession._object_key]",
                    uselist=False)
    
    expression_assays = db.relationship("Assay",
        primaryjoin="Reference._refs_key==Assay._refs_key",
        foreign_keys="[Assay._refs_key]",
        backref=db.backref("reference", uselist=False))
    
    # antibodypreps
    # backref in AntibodyPrep class
    
    @property
    def citation(self):
        authors = self.authors or ''
        title = self.title or ''
        journal = self.journal or ''
        rdate = self.date or ''
        vol = self.vol or ''
        issue = self.issue or ''
        pgs = self.pgs or ''
        
        return "%s, %s, %s %s;%s(%s):%s"% \
            (authors,title,journal, \
            rdate,vol,issue,pgs)
            
    @property
    def short_citation(self):
        primary = self._primary or ''
        journal = self.journal or ''
        rdate = self.date or ''
        vol = self.vol or ''
        issue = self.issue or ''
        pgs = self.pgs or ''
        return "%s, %s %s;%s(%s):%s" % (primary, journal,
                rdate, vol, issue, pgs)

    def __repr__(self):
        return "<Reference %s,%s>"%(self.title,self.authors)