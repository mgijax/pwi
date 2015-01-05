from flask import render_template
from blueprint import detail
from pwi.hunter import image_hunter
from pwi.hunter import reference_hunter
from pwi.util import error_template
from pwi import app

# Routes

@detail.route('/image/<string:id>')
def imageDetailById(id):
    image = image_hunter.getImageByMGIID(id)
    if image:
        return renderImageDetail(image)
    #return renderImageDetail()
    
    return error_template('No image found for ID = %s' % id)

# Helpers

def renderImageDetail(image):

    reference = reference_hunter.getReferenceByKey(image._refs_key)
    
    return render_template('detail/image_detail.html', image = image, reference = reference)
