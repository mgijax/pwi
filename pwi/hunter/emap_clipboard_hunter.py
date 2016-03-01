# Used to access marker related data
from pwi import app
from mgipython.model import VocTerm, Accession, Set, SetMember
from mgipython.modelconfig import db
from accession_hunter import getModelByMGIID

def getEmapClipboard(userDbKey=""):
    
    # DB Key of Set
    EMAPA_SET_KEY = 1046
    
    setMembers = []

    if userDbKey:
      query = SetMember.query
      query = query.filter(
        SetMember._createdby_key == userDbKey
      ).filter(
        SetMember._set_key == 1046
      )
      query = query.order_by(SetMember.sequencenum)
      setMembers = query.all()

    return setMembers




