# Used to access allele related data
from pwi.model import Image
from pwi import db
from accession_hunter import getModelByMGIID

def getImageByKey(key):
    image = Image.query.filter_by(_image_key=key).first()
    return image

def getImageByMGIID(id):
    id = id.upper()
    #image = Image.query.filter_by(mgiid=id).first()
    image = getModelByMGIID(Image, id, 'acc_mgitype_key')
    return image




def searchImages(allele_id=None,
                     limit=None):

    #app.logger.info('In hunter - calling searchImages')
    
    query = Image.query
    
    #if marker_id:
    #    query = query.filter(
    #        Reference.explicit_markers.any(Marker.mgiid==marker_id)     
    #    )
        
    #if allele_id:
    #    allele_accession = db.aliased(Accession)
    #    sub_reference = db.aliased(Reference)
    #    sq = db.session.query(sub_reference) \
    #            .join(sub_reference.explicit_alleles) \
    #            .join(allele_accession, Allele.mgiid_object) \
    #            .filter(allele_accession.accid==allele_id) \
    #            .filter(sub_reference._refs_key==Reference._refs_key) \
    #            .correlate(Reference)
    #        
    #    query = query.filter(
    #            sq.exists()
    #    )
                        

    # setting sort
    #query = query.order_by(Image._image_key.desc())

    # setting limit on number of returned image
    if limit:
        query = query.limit(limit) 
                   
    #images = query.all()
    images = []
    images.append(getImageByMGIID('MGI:5441481'))
    
    return images
