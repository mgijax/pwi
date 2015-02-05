# Used to access mapping experiment data
from pwi.model import Accession, MappingExperiment, ExperimentMarkerAssoc, Marker, Reference
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists, performQuery
from accession_hunter import getModelByMGIID

def getExperimentByKey(key):
    experiment = MappingExperiment.query.filter_by(_expt_key=key).first()
    _prepExperiment(experiment)
    return experiment

def getExperimentByMGIID(id):
    id = id.upper()
    #marker = Marker.query.filter_by(mgiid=id).first()
    experiment = getModelByMGIID(MappingExperiment, id)
    _prepExperiment(experiment)
    return experiment

def _prepExperiment(experiment):
    """
    Load any attributes a detail page might need
    """
    if experiment:
        batchLoadAttribute([experiment], 'marker_assocs')
        batchLoadAttribute(experiment.marker_assocs, 'marker', uselist=False)
        batchLoadAttribute(experiment.marker_assocs, 'allele', uselist=False)
    

def searchExperiments(marker_id=None,
                  expttypes=None,
                  limit=None):
    """
    Perform search for MappingExperiment records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by MappingExperiment.expttype, _refs_key
    """
    
    query = MappingExperiment.query
    
    
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_experiment = db.aliased(MappingExperiment)
        sq = db.session.query(sub_experiment) \
                .join(sub_experiment.marker_assocs) \
                .join(ExperimentMarkerAssoc.marker) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_experiment._expt_key==MappingExperiment._expt_key) \
                .correlate(MappingExperiment)
            
        query = query.filter(
                sq.exists()
        )
            
    if expttypes:
        query = query.filter(MappingExperiment.expttype.in_(MappingExperiment.VALID_EXPTTYPES))
            
    query = query.order_by(MappingExperiment.expttype, MappingExperiment._refs_key)
    
    if limit:
        query = query.limit(limit)
        
    experiments = query.all()
    
    # load any necessary data for summary
    batchLoadAttribute(experiments, 'reference', uselist=False)
    
    return experiments

    
