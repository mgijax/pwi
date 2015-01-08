# Used to access marker related data
from pwi.model import VocTerm
from pwi import db
from accession_hunter import getModelByMGIID

def getVocTermByKey(key):
    return VocTerm.query.filter_by(_term_key=key).first()

def getVocTermByPrimaryID(id):
    id = id.upper()
    #return VocTerm.query.filter_by(primaryid=id).first()
    return getModelByMGIID(VocTerm, id)
    