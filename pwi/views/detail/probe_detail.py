from flask import render_template
from blueprint import detail
from pwi.hunter import probe_hunter
from pwi.util import error_template

# Routes

@detail.route('/probe/key/<int:key>')
def probeDetailByKey(key):
    probe = probe_hunter.getProbeByKey(key)
    if probe:
        return renderProbeDetail(probe)

    return error_template('No probe found for _probe_key = %d' % key)
    
@detail.route('/probe/<string:id>')
def probeDetailById(id):
    probe = probe_hunter.getProbeByMGIID(id)
    if probe:
        return renderProbeDetail(probe)
    
    return error_template('No probe found for ID = %s' % id)

# Helpers

def renderProbeDetail(probe):
    
    hasAssays = probe_hunter.doesProbeHaveAssays(probe._probe_key)
    
    return render_template('detail/probe_detail.html',
                           probe = probe,
                           hasAssays = hasAssays
    )