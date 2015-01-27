# Used to access probe related data
from pwi.model import Accession, Antibody, AntibodyPrep, Assay, Marker, Reference
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists
from accession_hunter import getModelByMGIID

def getAntibodyByKey(key):
    antibody = Antibody.query.filter_by(_antiobdy_key).first()
    _prepAntibody(antibody)
    return antibody

def getAntibodyByMGIID(id):
    id = id.upper()
    antibody = getModelByMGIID(Antibody, id)
    _prepAntibody(antibody)
    return antibody

def _prepAntibody(antibody):
    """
    Load any attributes a detail page might need
    """
    pass

def searchAntibodies(marker_id=None,
                 refs_id=None, 
                  limit=None):
    """
    Perform search for Antibody records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by Antibody.antibodyname
    """
    
    query = Antibody.query
    
   
    if refs_id:
        
        reference_accession = db.aliased(Accession)
        sub_antibody = db.aliased(Antibody)
        sq = db.session.query(sub_antibody) \
                .join(sub_antibody.antibodypreps) \
                .join(AntibodyPrep.assay) \
                .join(Assay.reference) \
                .join(reference_accession, Reference.jnumid_object) \
                .filter(reference_accession.accid==refs_id) \
                .filter(sub_antibody._antibody_key==Antibody._antibody_key) \
                .correlate(Antibody)
            
        query = query.filter(
                sq.exists()
        )
        
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_antibody = db.aliased(Antibody)
        sq = db.session.query(sub_antibody) \
                .join(sub_antibody.antibodypreps) \
                .join(AntibodyPrep.assay) \
                .join(Assay.marker) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_antibody._antibody_key==Antibody._antibody_key) \
                .correlate(Antibody)
            
        query = query.filter(
                sq.exists()
        )
            
    query = query.order_by(Antibody.antibodyname)
    
    if limit:
        query = query.limit(limit)
        
    antibodies = query.all()
    
    # load data needed on summary page
    batchLoadAttribute(antibodies, 'antibodypreps')
    preps = []
    for antibody in antibodies:
        preps.extend(antibody.antibodypreps)
        
    batchLoadAttribute(preps, 'marker', uselist=False)
    batchLoadAttribute(preps, 'reference', uselist=False)
    
    return antibodies