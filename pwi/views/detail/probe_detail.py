from flask import render_template
from blueprint import detail
from pwi.hunter import probe_hunter
from mgipython.util import error_template
from mgipython.model.query import batchLoadAttribute

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
    childProbe = probe_hunter.getChildProbe(probe._probe_key)
    
    batchLoadAttribute(probe._probe_reference_caches, 'sequence_accids')
    batchLoadAttribute(probe._probe_reference_caches, 'probe_rflv')
    batchLoadAttribute(probe._probe_reference_caches, 'probe_aliases')
    batchLoadAttribute(probe._probe_reference_caches, 'refnotechunks')
    
    return render_template('detail/probe_detail.html',
                           probe = probe,
                           hasAssays = hasAssays,
			   childProbe = childProbe
    )
