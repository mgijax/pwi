# Used to access marker related data
from pwi import app, db
from pwi.model import Marker

def getMarkerByKey(key):
    return Marker.query.filter_by(_marker_key=key).first()

def getMarkerByMGIID(id):
    id = id.upper()
    return Marker.query.filter_by(mgiid=id).first()