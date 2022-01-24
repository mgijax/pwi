# Used to access accession objects
from mgipython.model import Accession, Marker
from pwi import db, app
from sqlalchemy.orm import class_mapper
from mgipython.parse.parser import splitCommaInput

MGI_LDB_KEY = 1
OMIN_LDB_KEY = 15
GO_LDB_KEY = 31
MP_LDB_KEY = 34
DO_LDB_KEY = 191
EMAPA_LDB_KEY = 169
EMAPS_LDB_KEY = 170
CL_LDB_KEY = 173
ACCEPTED_LDBS = [MGI_LDB_KEY, OMIN_LDB_KEY, GO_LDB_KEY, MP_LDB_KEY, DO_LDB_KEY, EMAPA_LDB_KEY, EMAPS_LDB_KEY, CL_LDB_KEY]

def getAccessionByAccID(id, inMGITypeKeys=[]):

    # split and prep the IDs
    accidsToSearch = splitCommaInput(id.lower())

    # build accid query
    query = Accession.query
    query = query.filter(
        db.and_(
            db.func.lower(Accession.accid).in_((accidsToSearch)),
            Accession._logicaldb_key.in_((ACCEPTED_LDBS))
        )
    ) 

    # add keys to filter, if have have any
    if inMGITypeKeys:
        query = query.filter(Accession._mgitype_key.in_(inMGITypeKeys))

    # setting sort
    query = query.order_by(Accession._mgitype_key)

    #gather accession objects
    return query.all()


def getAccessionByMarkerSymbol(symbolSearch):
    """
    Return acc_accession objects that match on symbol
    """
    
    # split on comma, but still include original string,
    # because some symbols have commas
    symbolsToSearch = set([symbolSearch.lower()])
    tokens = splitCommaInput(symbolSearch.lower())
    symbolsToSearch = symbolsToSearch.union(tokens)
    
    app.logger.debug("symbols to search = %s" % symbolsToSearch)
    
    # join marker via primary mgiid
    query = Accession.query
    
    query = query.join(Marker.mgiid_object) \
        .filter(Marker._organism_key==1)
    
    
    query = query.filter(db.func.lower(Marker.symbol).in_(symbolsToSearch))
    
    return query.all()


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

