# Used to access allele related data
from pwi.model import Image
from pwi import db
from accession_hunter import getModelByMGIID

def getImageByKey(key):
    image = Image.query.filter_by(_image_key=key).first()
    return image

def getImageByMGIID(id):
    id = id.upper()
    #image = Image.query.filter_by(mgiid=id).first()
    image = getModelByMGIID(Image, id, 'acc_mgitype_key')
    return image

