# Used to access marker related data
from pwi.model import VocTerm, Accession
from pwi import db
from accession_hunter import getModelByMGIID

def getVocTermByKey(key):
    return VocTerm.query.filter_by(_term_key=key).first()

def getVocTermByPrimaryID(id):
    id = id.upper()
    #return VocTerm.query.filter_by(primaryid=id).first()
    accAlias = db.aliased(Accession)
    return VocTerm.query.join(accAlias, VocTerm.primaryid_object) \
            .filter(accAlias.accid==id).first()
    