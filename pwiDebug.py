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
marker = db.session().query(Marker).filter_by(mgiid="MGI:88351").one()
print "have marker"
print marker.mgiid




print "<<--------------------------------------------------<<-ending"
