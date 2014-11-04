# Used to access nomen related data
from pwi.model import NOM_Marker,Synonym
from pwi import db
from pwi.model.core import batchLoad

def getNOM_MarkerByKey(key):
    return NOM_Marker.query.filter_by(_nomen_key=key).first()

def getNOM_MarkerByMGIID(id):
    id = id.upper()
    return Marker.query.filter_by(mgiid=id).first()

def searchNOM_Markers(nomen=None,nomen_statuses=[],limit=None):
    """
    Perform search for NOM_Marker records by various parameters
    e.g. nomen
    
    can exclude nomen statuses by including a list of nomen_statuses
    
    ordered by Marker.symbol
    """
    if not nomen:
        return []
    
    nomen = nomen.lower()
    
    query = NOM_Marker.query \
            .filter(
                    db.or_(db.func.lower(NOM_Marker.symbol).like(nomen),
                           db.func.lower(NOM_Marker.name).like(nomen),
                           NOM_Marker.synonyms.any(db.func.lower(Synonym.synonym).like(nomen))
                           )
            ) 
            
    if nomen_statuses: 
        query = query.filter(NOM_Marker.nomenstatus.in_(nomen_statuses))   
        
    query = query.order_by(NOM_Marker.symbol)
    
    if limit:
        query = query.limit(limit)
    
    nomens = query.all()
    
    # batch load some related data needed on summary page
    batchLoad(nomens, 'synonyms')
    
    return nomens