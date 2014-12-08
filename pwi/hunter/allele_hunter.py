# Used to access allele related data
from pwi.model import Allele
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists

def getAlleleByKey(key):
    allele = Allele.query.filter_by(_allele_key=key).first()
    return allele

def getAlleleByMGIID(id):
    id = id.upper()
    allele = Allele.query.filter_by(mgiid=id).first()
    return allele

def searchAlleles(refs_id=None, mrk_id=None, limit=None):
    """
    Perform search for Alleles
    """
    
    query = Allele.query.filter_by(_organism_key=1)
    
    if refs_id:
        query = query.filter(
#                Allele.explicit_references.any(Reference.jnumid==refs_id)
        )
            
    query = query.order_by(Marker.markerstatus, Marker.symbol)
    
    if limit:
        query = query.limit(limit)
        
    alleles = query.all()
    
    return markers