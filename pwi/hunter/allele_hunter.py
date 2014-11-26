# Used to access marker related data
from pwi.model import Allele
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists

def getAlleleByKey(key):
    allele = Allele.query.filter_by(_allele_key=key).first()
    return allele

def getAlleleByMGIID(id):
    id = id.upper()
    allele = Allele.query.filter_by(mgiid=id).first()
    return allele

