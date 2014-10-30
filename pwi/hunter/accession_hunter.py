# Used to access accession objects
from pwi.model import Accession
from pwi import db

def getAccessionByAccID(id, inMGITypeKeys=[]):
    query = Accession.query.filter(
            db.func.lower(Accession.accid)==db.func.lower(id))
    if inMGITypeKeys:
        query = query.filter(Accession._mgitype_key.in_(inMGITypeKeys))
    return query.first()