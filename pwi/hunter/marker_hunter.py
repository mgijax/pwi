# Used to access marker related data
from pwi.model import Marker, Synonym, Reference
from pwi import db
from pwi.model.query import batchLoadAttribute

def getMarkerByKey(key):
    return Marker.query.filter_by(_marker_key=key).first()

def getMarkerByMGIID(id):
    id = id.upper()
    return Marker.query.filter_by(mgiid=id).first()


def searchMarkers(nomen=None, _refs_key=None, limit=None):
    """
    Perform search for Marker records by various parameters
    e.g. nomen, _refs_key
    
    ordered by Marker.symbol
    """
    
    query = Marker.query.filter_by(_organism_key=1)
    
    if nomen:
        nomen = nomen.lower()
        # query Marker symbol, name, synonyms
        query = query.filter(
                db.or_(db.func.lower(Marker.symbol).like(nomen),
                       db.func.lower(Marker.name).like(nomen),
                       Marker.synonyms.any(db.func.lower(Synonym.synonym).like(nomen))
                       )
        ) 
            
    if _refs_key:
        query = query.filter(
                Marker.explicit_references.any(Reference._refs_key==_refs_key)
        )
            
    query = query.order_by(Marker.markerstatus, Marker.symbol)
    
    if limit:
        query = query.limit(limit)
        
    markers = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(markers, 'synonyms')
    
    return markers