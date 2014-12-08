# All models for the acc_* tables
from pwi import db,app
from pwi.model.core import *
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
    
    # TODO - not working without manually defining joins and foreign key; could be self-join issue?
    #thumbnail = db.relationship("Image", uselist=False)
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
        uselist=False,
        backref=db.backref("imagepane", uselist=False))
    
    @property
    def figurelabel(self):
        figurelabel = self.image.figurelabel or ''
        panelabel = self.panelabel or ''
        return '%s%s' % (figurelabel, panelabel)
        
