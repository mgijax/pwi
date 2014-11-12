from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from pwi.model import Reference
from pwi import db
from pwi import app

def getReferenceByKey(key):
    return Reference.query.filter_by(_refs_key=key).first()

def getReferenceByID(id):
    id = id.upper()
    return Reference.query.filter_by(jnumid=id).first()


def searchReferences(accids=None):
    #app.logger.info('In hunter - calling searchReferences')
    
    # split and prep the IDs
    accidsToSearch = []
    accidsSplit = accids.split(',')
    for accid in accidsSplit:
        app.logger.info(type(accid))
        accidsToSearch.append(accid.strip())

    query = Reference.query
    
    if accids:
        query = query.filter(
            db.or_(
                Reference.jnumid.in_((accidsToSearch)),
                Reference.pubmedid.in_((accidsToSearch))
            )
        ) 
                        
    query = query.order_by(Reference.jnumid)
            
    references = query.all()
       
    return references