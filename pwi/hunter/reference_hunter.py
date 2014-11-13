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


def searchReferences(accids=None, marker_id=None):
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
    
    if marker_id:
        query = query.filter(
            Reference.explicit_markers.any(Marker.mgiid==marker_id)     
        )
                        
    query = query.order_by(Reference.jnumid)
            
    references = query.all()
    
    
    # load any exists attributes for other summary links
    batchLoadAttributeExists(references, ['explicit_markers'])
       
    return references

def splitCommaInput(param):
    """
    split input on comma
    returns lists of inputs
    """
    accidsToSearch = []
    accidsSplit = param.split(',')
    for accid in accidsSplit:
        app.logger.info(type(accid))
        accidsToSearch.append(accid.strip())
    return accidsToSearch