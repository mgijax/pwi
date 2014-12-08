# Used to access marker related data
from pwi.model import Assay, Marker, Reference, Allele
from pwi import db
from pwi.model.query import batchLoadAttribute

def getAssayByKey(key):
    return Assay.query.filter_by(_assay_key=key).first()

def getAssayByMGIID(id):
    id = id.upper()
    return Assay.query.filter_by(mgiid=id).first()


def searchAssays(marker_id=None,
                 allele_id=None,
                 refs_id=None, 
                 limit=None):
    """
    Perform search for GXD Assay records by various parameters
    e.g. Marker nomen, Assay _refs_key
    
    ordered by Marker.symbol
    """
    
    query = Assay.query
    
    # join Marker + Reference for the order by clause
    query = query.join(Assay.marker)
    query = query.join(Assay.reference)
    
    if marker_id:
        # query Marker MGI ID
        query = query.filter(Marker.mgiid==marker_id)
        
    if allele_id:
        # query Allele MGI ID
        query = query.filter(
                Assay.alleles.any(Allele.mgiid==allele_id)
        )
            
    if refs_id:
        query = query.filter(Reference.jnumid==refs_id)
            
    query = query.order_by(Marker.symbol, Assay.assaytype, Reference.authors)
    
    if limit:
        query = query.limit(limit)
        
    assays = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(assays, 'marker', uselist=False)
    batchLoadAttribute(assays, 'reference', uselist=False)
    
    return assays
