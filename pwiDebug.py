from pwi import db
from pwi.model.mgd.all import *
from pwi.model.mgd.gxd import *
from pwi.model.mgd.img import *
from pwi.model.mgd.mgi import *
from pwi.model.mgd.mrk import *
from pwi.model.mgd.voc import *
from pwi.hunter.accession_hunter import getModelByMGIID
from pwi.templatetags import filters


print ">>-------------------------------------------------->>-starting"
marker = db.session().query(Marker).filter_by(mgiid="MGI:88351").one()
print "have marker"
print marker.mgiid





print "<<--------------------------------------------------<<-ending"


