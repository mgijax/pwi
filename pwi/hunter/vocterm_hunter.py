# Used to access marker related data
from mgipython.model import VocTerm, Accession, Vocab, Synonym, VocTermEMAPS, VocTermEMAPA
from mgipython.modelconfig import db
from .accession_hunter import getModelByMGIID
from mgipython.parse.parser import emapaStageParser, splitSemicolonInput
from mgipython.model.query import batchLoadAttribute

def getVocTermByKey(key):
    return VocTerm.query.filter_by(_term_key=key).first()

def getVocTermByPrimaryID(id):
    id = id.upper()
    #return VocTerm.query.filter_by(primaryid=id).first()
    accAlias = db.aliased(Accession)
    return VocTerm.query.join(accAlias, VocTerm.primaryid_object) \
            .filter(accAlias.accid==id).first()
    



