# Used to access probe related data
from pwi.model import Accession, Probe, Marker, Reference
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists
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
    # add the has_explicit_references existence attribute
    batchLoadAttributeExists([probe], ['references', 'markers'])

def searchProbes(marker_id=None,
                 refs_id=None, 
                  limit=None):
    """
    Perform search for Probe records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by Probe.name
    """
    
    query = Probe.query
    
   
    if refs_id:
        query = query.filter(
                Probe.references.any(Reference.jnumid==refs_id)
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
#     probe_assocs = []
#     for probe in probes:
#         probe_assocs.extend(probe.probe_marker_caches)
#     batchLoadAttribute(probe_assocs, 'marker', uselist=False)
    
    return probes