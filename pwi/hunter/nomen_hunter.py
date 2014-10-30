# Used to access nomen related data
from pwi.model import NOM_Marker,Synonym
from pwi import db

def getNOM_MarkerByKey(key):
    return NOM_Marker.query.filter_by(_nomen_key=key).first()

def getNOM_MarkerByMGIID(id):
    id = id.upper()
    return Marker.query.filter_by(mgiid=id).first()

def searchNOM_MarkerByNomen(nomen,nomen_statuses=[],limit=1000):
    """
    Perform a nomenclature search for NOM_Marker records
    hitting symbol, name, or synonyms
    """
    nomen = nomen.lower()
    
    query = NOM_Marker.query \
            .options(db.joinedload('synonyms')) \
            .outerjoin(NOM_Marker.synonyms, aliased=True) \
            .filter(
                    db.or_(db.func.lower(NOM_Marker.symbol).like(nomen),
                           db.func.lower(NOM_Marker.name).like(nomen),
                           db.func.lower(Synonym.synonym).like(nomen)
                           )
            )
            
    if nomen_statuses: 
        query = query.filter(NOM_Marker.nomenstatus.in_(nomen_statuses))   
        
    query.order_by(NOM_Marker.symbol)
    
    if limit:
        return query.all()[:limit]
    
    return query.all()