# Used to access marker related data
from pwi.model import Assay, Marker, Synonym, Reference, \
    Specimen, GelLane, ADStructure, InSituResult
from pwi import db
from pwi.model.query import batchLoadAttribute

def getAssayByKey(key):
    return Assay.query.filter_by(_assay_key=key).first()

def getAssayByMGIID(id):
    id = id.upper()
    return Assay.query.filter_by(mgiid=id).first()


def searchAssays(nomen=None,_refs_key=None, limit=1000):
    """
    Perform search for GXD Assay records by various parameters
    e.g. Marker nomen, Assay _refs_key
    
    ordered by Marker.symbol
    """
    
    query = Assay.query
    
    # join Marker for the order by clause
    query = query.join(Assay.marker)
    
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
                Assay._refs_key==_refs_key
        )
            
    query = query.order_by(Marker.symbol)
    
    if limit:
        query = query.limit(limit)
        
    assays = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(assays, 'marker')
    batchLoadAttribute(assays, 'reference')
    batchLoadAttribute(assays, 'assaytype')
    
    return assays


def searchAssayResults(nomen=None,_refs_key=None, limit=1000):
    """
    Perform search for GXD Assay Result records by various parameters
    e.g. Marker nomen, Assay _refs_key
    
    ordered by Marker.symbol
    """
    
    query1 = ADStructure.query.join(ADStructure.insituresults) \
        .join(InSituResult.specimen) \
        .join(Specimen.assay) \
        .join(Assay.marker)
        
    query2 = ADStructure.query.join(ADStructure.gellanes) \
        .join(GelLane.assay) \
        .join(Assay.marker)
    
    
    if nomen:
        nomen = nomen.lower()
        # query Marker symbol, name, synonyms
        query1 = query1.filter(
                db.or_(db.func.lower(Marker.symbol).like(nomen),
                       db.func.lower(Marker.name).like(nomen),
                       Marker.synonyms.any(db.func.lower(Synonym.synonym).like(nomen))
                       )
        ) 
        query2 = query2.filter(
                db.or_(db.func.lower(Marker.symbol).like(nomen),
                       db.func.lower(Marker.name).like(nomen),
                       Marker.synonyms.any(db.func.lower(Synonym.synonym).like(nomen))
                       )
        ) 
            
    if _refs_key:
        query1 = query1.filter(
                Assay._refs_key==_refs_key
        )
        
        query2 = query2.filter(
                Assay._refs_key==_refs_key
        )
            
    
    query = query1.union(query2)
    
    if limit:
        query = query.limit(limit)
        
    results = query.all()
    
    return results