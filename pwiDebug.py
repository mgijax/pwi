"""
    You may modify and run this file to debug the PWI
    
    (must source Configuration first)
"""

# example for querying Model objects
from pwi import db
from mgipython.model.mgd.all import *
from mgipython.model.mgd.gxd import *
from mgipython.model.mgd.img import *
from mgipython.model.mgd.mgi import *
from mgipython.model.mgd.mrk import *
from mgipython.model.mgd.voc import *
from pwi.hunter.accession_hunter import getModelByMGIID
from pwi.templatetags import filters


print ">>-------------------------------------------------->>-starting"
query = SetMember.query
query = query.filter(
  SetMember._createdby_key == 1025
).filter(
  SetMember._set_key == 1046
)

query = query.order_by(SetMember.sequencenum)
setMembers = query.all()

for setMember in setMembers:
  print setMember._set_key
  print setMember.emapa._stage_key
  print setMember.emapa_term



print "<<--------------------------------------------------<<-ending"
