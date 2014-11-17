from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from pwi.model import Reference, Marker
from pwi.model.query import batchLoadAttributeExists
from pwi import db
from pwi import app

def getReferenceByKey(key):
    return Reference.query.filter_by(_refs_key=key).first()

def getReferenceByID(id):
    id = id.upper()
    return Reference.query.filter_by(jnumid=id).first()


def searchReferences(accids=None, 
                     journal=None, 
                     authors=None, 
                     primeAuthor=None, 
                     volume=None, 
                     year=None, 
                     marker_id=None, 
                     limit=None):
    #app.logger.info('In hunter - calling searchReferences')
    
    query = Reference.query
    
    if accids:
        # split and prep the IDs
        accidsToSearch = splitCommaInput(accids)
        
        query = query.filter(
            db.or_(
                Reference.jnumid.in_((accidsToSearch)),
                Reference.pubmedid.in_((accidsToSearch))
            )
        ) 
    
    if authors:
        query = query.filter(
            Reference.authors.like(authors),
        )

    if primeAuthor:
        query = query.filter(
            Reference._primary.like(primeAuthor),
        )

    if journal:
        query = query.filter(
            Reference.journal.like(journal),
        )

    if volume:
        query = query.filter(Reference.vol==volume)

    if year:
        query = query.filter(Reference.year==int(year))

    if marker_id:
        query = query.filter(
            Reference.explicit_markers.any(Marker.mgiid==marker_id)     
        )
                        
    # setting sort
    query = query.order_by(Reference._refs_key.desc())

    # setting limit on number of returned references
    if limit:
        query = query.limit(limit) 
                   
    references = query.all()
       
    return references

def splitCommaInput(param):
    """
    split input on comma
    returns lists of inputs
    """
    accidsToSearch = []
    accidsSplit = param.split(',')
    for accid in accidsSplit:
        accidsToSearch.append(accid.strip())
    return accidsToSearch