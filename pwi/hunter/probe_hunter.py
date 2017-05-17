# Used to access probe related data
from mgipython.model import Accession, Probe, Marker, Reference, ProbeAlias, ProbeReferenceCache, VocTerm
from pwi import db, app
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeExists, performQuery
from accession_hunter import getModelByMGIID

def getProbeByKey(key):
    probe = Probe.query.filter_by(_probe_key=key).first()
    _prepProbe(probe)
    return probe

def getProbeByMGIID(id):
    id = id.upper()
    #marker = Marker.query.filter_by(mgiid=id).first()
    probe = getModelByMGIID(Probe, id)
    _prepProbe(probe)
    return probe

def _prepProbe(probe):
    """
    Load any attributes a detail page might need
    """
    if probe:
        # add the has_references existence attribute
        batchLoadAttribute([probe], 'markers')
        batchLoadAttribute([probe], 'references')
    

def searchProbes(marker_id=None,
                 refs_id=None, 
                 probe_name=None,
                 segmenttypes=None,
                 limit=None):
    """
    Perform search for Probe records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by Probe.name
    """
    
    query = Probe.query
    
    if segmenttypes:
        segtypeAlias = db.aliased(VocTerm)
        
        query = query.join(segtypeAlias, Probe.segmenttype_obj) \
                .filter(segtypeAlias.term.in_(segmenttypes))
        
   
    if refs_id:
        
        ref_accession = db.aliased(Accession)
        sub_probe = db.aliased(Probe)
        
        sq = db.session.query(sub_probe) \
                .join(sub_probe.references) \
                .join(ref_accession, Reference.jnumid_object) \
                .filter(ref_accession.accid==refs_id) \
                .filter(sub_probe._probe_key==Probe._probe_key) \
                .correlate(Probe)
        
        query = query.filter(
                sq.exists()
        )
        
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_probe = db.aliased(Probe)
        sq = db.session.query(sub_probe) \
                .join(sub_probe.markers) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_probe._probe_key==Probe._probe_key) \
                .correlate(Probe)
            
        query = query.filter(
                sq.exists()
        )
        
        
    if probe_name:
        probe_name = probe_name.lower()
        
        probeAlias = db.aliased(ProbeAlias)
        probeRef = db.aliased(ProbeReferenceCache)
        sub_probe = db.aliased(Probe)
        
        alias_sq = db.session.query(sub_probe) \
            .join(probeRef, sub_probe._probe_reference_caches) \
            .join(probeAlias, probeRef.probe_aliases) \
            .filter(db.func.lower(probeAlias.alias).like(probe_name)) \
            .filter(sub_probe._probe_key==Probe._probe_key) \
            .correlate(Probe)
        
        query1 = query.filter(db.func.lower(Probe.name).like(probe_name))
        query2 = query.filter(alias_sq.exists())
        
        query = query1.union(query2)
   
            
    query = query.order_by(Probe.name)
    
    if limit:
        query = query.limit(limit)
        
    probes = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(probes, 'source')
    batchLoadAttribute(probes, 'markers')
    batchLoadAttribute(probes, 'references')
    batchLoadAttribute(probes, '_probe_marker_caches')
    batchLoadAttribute(probes, '_probe_reference_caches')
    batchLoadAttribute(probes, '_probe_reference_caches.probe_aliases')
    batchLoadAttribute(probes, 'derivedfrom_probe')
    
#     probe_assocs = []
#     for probe in probes:
#         probe_assocs.extend(probe.probe_marker_caches)
#     batchLoadAttribute(probe_assocs, 'marker')
    
    return probes

def doesProbeHaveAssays(_probe_key):
    """
    return if the probe has expression data
    """
    
    sql = '''
    select 1 
    from gxd_probeprep pp join
        gxd_assay a on a._probeprep_key=pp._probeprep_key
    where pp._probe_key = %d
    ''' % _probe_key
    
    results, cols = performQuery(sql)
    return len(results) > 0

def getChildProbe(key):
    """
    TR12006/add link to child probe
    would be best if this could be done via "db.relationship"
    in mgipython/model/mgd/prb.py, but could not find a way to do so

    note : there may be > 1 child probe
    """
    sql = '''
	select p2.name, a.accid as mgiid
	from prb_probe p1, prb_probe p2, acc_accession a
	where p1._probe_key = %d
	and p1._probe_key = p2.derivedfrom
        and p2._probe_key = a._object_key
        and a._mgitype_key = 3
	and a.preferred = 1
	and a._logicaldb_key = 1
	''' % (key)

    results, cols = performQuery(sql)

    if len(results) == 0:
    	return ''

    else:
    	return results

