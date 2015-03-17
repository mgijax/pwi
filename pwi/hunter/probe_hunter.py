# Used to access probe related data
from pwi.model import Accession, Probe, Marker, Reference
from pwi import db, app
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists, performQuery
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
                  limit=None):
    """
    Perform search for Probe records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by Probe.name
    """
    
    query = Probe.query
    
    if app.config['DBTYPE'] == 'Sybase':
        
        # Sybase has trouble with planning the probe summary query
        #     We defer some of the text columns we don't need to give 
        #        it some help.
        
        query = query.options(db.defer(Probe.regioncovered), 
                              db.defer(Probe.primer1sequence),
                              db.defer(Probe.primer2sequence),
                              db.defer(Probe.insertsite),
                              db.defer(Probe.insertsize),
                              db.defer(Probe.productsize),
                              db.defer(Probe.derivedfrom),
                              db.defer(Probe._vector_key),
                              db.defer(Probe._segmenttype_key),
                              db.defer(Probe._source_key),
                              db.defer(Probe.mgiid),
                              db.defer(Probe.vector))
    
   
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
            
    query = query.order_by(Probe.name)
    
    if limit:
        query = query.limit(limit)
        
    probes = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(probes, 'markers')
    batchLoadAttribute(probes, '_probe_marker_caches')
    
    # we are using mgiid_object instead of mgiid column_property for the
    #    summary, because sybase can't properly plan the query 
    #    TODO (kstone): remove this and use mgiid in summary table instead
    #        After the flip
    batchLoadAttribute(probes, 'mgiid_object')
    
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

    
