# Used to access allele related data
from pwi.model import Image
from pwi.model import Allele
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


def searchImages(allele_id=None, limit=None):

    query = Image.query

    molimages = []
    phenoimages = []
            
    # for this allele, use it's allele assoc objects to gather images
    if allele_id:
        allele = getModelByMGIID(Allele, allele_id)

        for molecularimagepane in allele.molecularimagepanes:
            molimages.append(molecularimagepane.image)

        for phenoimagepane in allele.phenoimagepanes:
            phenoimages.append(phenoimagepane.image)

    return molimages, phenoimages
