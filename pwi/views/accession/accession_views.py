from flask import redirect, request
from blueprint import accession
from pwi.hunter import accession_hunter
from pwi.util import error_template
from pwi.model import Marker
from pwi import app

# Constants

# map type keys to Objects
# Add new mappings here and in getURLForObject()
ACC_TYPE_MAP = {
            # marker
            2 : 'Marker'
            }

# Routes

@accession.route('/query', methods=['GET'])
def accessionByIDFromForm():
    id = request.args.get('id')
    return renderAccessionIDSearch(id)

@accession.route('/<string:id>')
def accessionByID(id):
    return renderAccessionIDSearch(id)


# Helpers

def renderAccessionIDSearch(id):
    global ACC_TYPE_MAP
    
    # try with mapped mgitype keys first
    accessionObj = accession_hunter.getAccessionByAccID(id, inMGITypeKeys=ACC_TYPE_MAP.keys())
    if not accessionObj:
        # now expand the criteria to potentially yield a more descriptive error message
        accessionObj = accession_hunter.getAccessionByAccID(id)
        
    if accessionObj:
        # attempt to map the object to a valid detail page URL
        if accessionObj._mgitype_key in ACC_TYPE_MAP:
            objectType = ACC_TYPE_MAP[accessionObj._mgitype_key]
            newUrl = getURLForObject(accessionObj, objectType)
            return redirect(newUrl)
        else:
            tabletype = '%s(%s)' % (accessionObj.mgitype.name,accessionObj.mgitype.tablename)
            return error_template('Found %s object with ID = %s, '
                                   'but no link URL has been defined.' % (tabletype,id))
    
    return error_template('No accession object found for ID = %s' % id)


def getURLForObject(accessionObject, objectType):
    """
    Uses values from ACC_TYPE_MAP to determine where
    to link to with a valid accession object
    """
    url = ''
    
    # Add URL mappings here
    if objectType == 'Marker':
        # query the marker object to get mgiid for linking
        marker = Marker.query.filter_by(_marker_key=accessionObject._object_key).one()
        if marker:
            url = 'detail/marker/%s' % marker.mgiid
        else:
            app.logger.warn('Failed to map accession object with key=%d to a valid marker' % accessionObject._object_key)
            url = 'detail/marker/key/%d' % accessionObject._object_key
        
    if not url:
        app.logger.warn('Failed to find valid URL mapping for accession object with key=%d' % accessionObject._object_key)
    
    return url