# Used to access marker related data
from pwi.model import VocTerm
from pwi import db

def getVocTermByKey(key):
    return VocTerm.query.filter_by(_term_key=key).first()

def getVocTermByPrimaryID(id):
    id = id.upper()
    return VocTerm.query.filter_by(primaryid=id).first()
    