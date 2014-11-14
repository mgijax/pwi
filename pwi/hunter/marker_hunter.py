# Used to access marker related data
from pwi.model import Marker, Synonym, Reference
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists

def getMarkerByKey(key):
    marker = Marker.query.filter_by(_marker_key=key).first()
    _prepMarker(marker)
    return marker

def getMarkerByMGIID(id):
    id = id.upper()
    marker = Marker.query.filter_by(mgiid=id).first()
    _prepMarker(marker)
    return marker

def _prepMarker(marker):
    """
    Load any attributes a detail page might need
    """
    # add the has_explicit_references existence attribute
    batchLoadAttributeExists([marker], ['explicit_references', 'expression_assays'])

def searchMarkers(nomen=None, refs_id=None, limit=None):
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
            
    if refs_id:
        query = query.filter(
                Marker.explicit_references.any(Reference.jnumid==refs_id)
        )
            
    query = query.order_by(Marker.markerstatus, Marker.symbol)
    
    if limit:
        query = query.limit(limit)
        
    markers = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(markers, 'synonyms')
    
    return markers