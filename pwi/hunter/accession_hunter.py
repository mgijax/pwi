# Used to access accession objects
from pwi.model import Accession
from pwi import db
from sqlalchemy.orm import class_mapper

def getAccessionByAccID(id, inMGITypeKeys=[]):
    query = Accession.query.filter(
            db.func.lower(Accession.accid)==db.func.lower(id))
    if inMGITypeKeys:
        query = query.filter(Accession._mgitype_key.in_(inMGITypeKeys))
    return query.first()


def getModelByMGIID(modelClass, mgiid, mgitypeKeyAttr='_mgitype_key'):
    """
    Class must have _mgitype_key class attribute
    returns a subquery that can be filter as an exists clause
    
    E.g.
    marker = getModelByMGIID(Marker, 'MGI:12345')
    """
    subQuery = getModelByMGIIDSubQuery(modelClass, mgiid, mgitypeKeyAttr)
    return modelClass.query.filter( subQuery.exists() ).first()

def getModelByMGIIDSubQuery(modelClass, mgiid, mgitypeKeyAttr='_mgitype_key'):
    """
    Class must have _mgitype_key class attribute
    returns a subquery that can be filter as an exists clause
    
    E.g.
    subQuery = getModelByMGIIDSubQuery(Marker, 'MGI:12345')
    marker = Marker.query.filter( subQuery.exists() ).first()
    """
    sub_model = db.aliased(modelClass)
    accession_model = db.aliased(Accession)
    
    # get primary_key name
    pkName = class_mapper(modelClass).primary_key[0].name
    
    # get the _mgitype_key
    _mgitype_key = getattr(modelClass, mgitypeKeyAttr)
    
    sq = db.session.query(sub_model)
    sq = sq.join(accession_model, 
                db.and_(
                     accession_model.preferred==1,
                     accession_model._logicaldb_key==1,
                     accession_model.prefixpart=='MGI:',
                     accession_model._object_key==getattr(sub_model, pkName),
                     accession_model._mgitype_key==_mgitype_key
                ))
    sq = sq.filter(accession_model.accid==mgiid)
    sq = sq.filter(getattr(sub_model, pkName)==getattr(modelClass, pkName))
    sq = sq.correlate(modelClass)
    
    return sq
