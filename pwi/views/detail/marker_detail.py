from flask import render_template
from .blueprint import detail
from pwi.hunter import marker_hunter
from mgipython.util import error_template

# Routes

@detail.route('/marker/key/<int:key>')
def markerDetailByKey(key):
    marker = marker_hunter.getMarkerByKey(key)
    if marker:
        return renderMarkerDetail(marker)

    return error_template('No marker found for _marker_key = %d' % key)
    
@detail.route('/marker/<string:id>')
def markerDetailById(id):
    marker = marker_hunter.getMarkerByMGIID(id)
    if marker:
        return renderMarkerDetail(marker)
    
    return error_template('No marker found for ID = %s' % id)

# Helpers

def renderMarkerDetail(marker):
    return render_template('detail/marker_detail.html',
                           marker = marker)