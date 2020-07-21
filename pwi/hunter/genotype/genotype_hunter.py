# Used to access genotype related data
from mgipython.model import Genotype
from pwi.hunter.accession_hunter import getModelByMGIID

def getGenotypeByKey(key):
    genotype = Genotype.query.filter_by(_genotype_key=key).first()
    return genotype

def getGenotypeByMGIID(id):
    id = id.upper()
    genotype = getModelByMGIID(Genotype, id)
    return genotype
    