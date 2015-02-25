# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
from all import *
from acc import Accession


class Image(db.Model,MGIModel):
    __tablename__ = "img_image"
    _image_key = db.Column(db.Integer,primary_key=True)
    _mgitype_key = db.Column(db.Integer)
    _imageclass_key = db.Column(db.Integer)
    _refs_key = db.Column(db.Integer)
    _thumbnailimage_key = db.Column(db.Integer, mgi_fk("img_image._image_key"))
    xdim = db.Column(db.Integer)
    ydim = db.Column(db.Integer)
    figurelabel = db.Column(db.String())
    
    acc_mgitype_key = 9
    
    mgiid = db.column_property(
        db.select([Accession.accid]).
        where(db.and_(Accession._mgitype_key==acc_mgitype_key,
            Accession.prefixpart=='MGI:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==1, 
            Accession._object_key==_image_key)) 
    )
    
    pixnum = db.column_property(
        db.select([Accession.numericpart]).
        where(db.and_(Accession._mgitype_key==acc_mgitype_key,
            Accession.prefixpart=='PIX:', 
            Accession.preferred==1, 
            Accession._logicaldb_key==19, 
            Accession._object_key==_image_key)) 
    )
    
    # relationships
    
    reference = db.relationship("Reference",
        primaryjoin="and_(Image._refs_key==Reference._refs_key) ",
        foreign_keys="[Reference._refs_key]",
        uselist=False 
    )

    thumbnail = db.relationship("Image",
        primaryjoin="and_(Image._thumbnailimage_key==Image._image_key) ",
        foreign_keys="[Image._image_key]",
        uselist=False 
    )

    caption = db.relationship("Note",
        primaryjoin="and_(Image._image_key==Note._object_key, " 
                "Note._mgitype_key==9, Note._notetype_key==1024) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )
    
    copyright = db.relationship("Note",
        primaryjoin="and_(Image._image_key==Note._object_key, " 
                "Note._mgitype_key==9, Note._notetype_key==1023) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    externallink = db.relationship("Note",
        primaryjoin="and_(Image._image_key==Note._object_key, " 
                "Note._mgitype_key==9, Note._notetype_key==1039) ",
        foreign_keys="[Note._object_key]",
        uselist=False
    )

    imagepanes = db.relationship("ImagePane")
    
class ImagePane(db.Model,MGIModel):
    __tablename__ = "img_imagepane"
    _imagepane_key = db.Column(db.Integer,primary_key=True)
    _image_key = db.Column(db.Integer(), mgi_fk("img_image._image_key"))
    panelabel = db.Column(db.String())
    x = db.Column(db.Integer())
    y = db.Column(db.Integer())
    width = db.Column(db.Integer())
    height = db.Column(db.Integer())
    
    image = db.relationship("Image",
        uselist=False)

    imagePaneAssocs = db.relationship("ImagePaneAssocView",
        backref=db.backref("imagepane"))

    imagePaneAlleleAssocs = db.relationship("ImagePaneAssocView",
        primaryjoin="and_(ImagePane._imagepane_key==ImagePaneAssocView._imagepane_key, " 
                "ImagePaneAssocView._mgitype_key==11) ",
        foreign_keys="[ImagePaneAssocView._imagepane_key]"
    )

    imagePaneGenotypeAssocs = db.relationship("ImagePaneAssocView",
        primaryjoin="and_(ImagePane._imagepane_key==ImagePaneAssocView._imagepane_key, " 
                "ImagePaneAssocView._mgitype_key==12) ",
        foreign_keys="[ImagePaneAssocView._imagepane_key]"
    )

    gel = db.relationship("Assay",  
        primaryjoin="ImagePane._imagepane_key==Assay._imagepane_key",
        foreign_keys="[Assay._imagepane_key]",
        uselist=False)


    
    @property
    def figurelabel(self):
        figurelabel = self.image.figurelabel or ''
        panelabel = self.panelabel or ''
        return '%s%s' % (figurelabel, panelabel)
        
    @property
    def distinctInsitu(self):
        distinctAssays = []
        distinctAssaysKeys = []
        for result in self.insituresults:
          if result.specimen.assay._assay_key not in distinctAssaysKeys:
            distinctAssays.append(result.specimen.assay)
            distinctAssaysKeys.append(result.specimen.assay._assay_key)
        return distinctAssays
        
class ImagePaneAssoc(db.Model, MGIModel):
    __tablename__ = "img_imagepane_assoc"
    _assoc_key = db.Column(db.Integer, primary_key=True)
    _object_key = db.Column(db.Integer)
    _imagepane_key = db.Column(db.Integer, 
                               mgi_fk("img_imagepane._imagepane_key"))
    _mgitype_key = db.Column(db.Integer)
    isprimary = db.Column(db.Integer)
    
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

    allele = db.relationship("Allele",
        primaryjoin="and_(ImagePaneAssocView._object_key==Allele._allele_key, " 
                "ImagePaneAssocView._mgitype_key==11) ",
        foreign_keys="[Allele._allele_key]",
        uselist=False
    )

    genotype = db.relationship("Genotype",
        primaryjoin="and_(ImagePaneAssocView._object_key==Genotype._genotype_key, " 
                "ImagePaneAssocView._mgitype_key==12) ",
        foreign_keys="[Genotype._genotype_key]",
        uselist=False
    )
