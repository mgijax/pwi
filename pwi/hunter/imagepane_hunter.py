# Used to access allele related data
from mgipython.model import Image
from mgipython.model import ImagePane
from mgipython.model import Reference
from mgipython.model import Accession
from mgipython.modelconfig import db
from accession_hunter import getModelByMGIID


def searchImages(refs_id=None, limit=None):

    query = Image.query

    images = []
            
    # for this ref ID, gather images
    if refs_id:
        reference_accession = db.aliased(Accession)
        sub_image = db.aliased(Image)
        sq = db.session.query(sub_image) \
                .join(sub_image.reference) \
                .join(reference_accession, Reference.jnumid_object) \
                .filter(reference_accession.accid==refs_id) \
                .filter(sub_image._refs_key==Image._refs_key) \
                .correlate(Image)
                
        query = query.filter(
                sq.exists()     
        )

    query = query.order_by(Image.figurelabel)


    images = query.all()
     

    return images
