# Used to access marker related data
from pwi.model import ADStructure
from pwi import db
from accession_hunter import getModelByMGIID

def getStructureByKey(key):
    return ADStructure.query.filter_by(_structure_key=key).first()

def getStructureByPrimaryID(id):
    id = id.upper()
    return getModelByMGIID(ADStructure, id)
    