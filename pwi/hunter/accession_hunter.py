# Used to access accession objects
from pwi.model import Accession
from sqlalchemy import func

def getAccessionByAccID(id, inMGITypeKeys=[]):
    query = Accession.query.filter(
            func.lower(Accession.accid)==func.lower(id))
    if inMGITypeKeys:
        query = query.filter(Accession._mgitype_key.in_(inMGITypeKeys))
    return query.first()