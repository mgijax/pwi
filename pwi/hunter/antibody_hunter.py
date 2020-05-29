# Used to access probe related data
from mgipython.model import Accession, Antibody, AntibodyPrep, Marker, Reference
from pwi import db
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeExists
from .accession_hunter import getModelByMGIID

def getAntibodyByKey(key):
    antibody = Antibody.query.filter_by(_antibody_key=key).first()
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
    if antibody:
        pass

def searchAntibodies(marker_id=None,
                 refs_id=None):
    """
    Perform search for Antibody records by various parameters
    e.g. marker_id, _refs_id
    
    ordered by Marker.symbol, Antibody.antibodyname, Antibody.mgiid
    """
    
    query = Antibody.query
    
   
    if refs_id:
        
        reference_accession = db.aliased(Accession)
        sub_antibody = db.aliased(Antibody)
        sq = db.session.query(sub_antibody) \
                .join(sub_antibody.references) \
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
                .join(sub_antibody.markers) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_antibody._antibody_key==Antibody._antibody_key) \
                .correlate(Antibody)
            
        query = query.filter(
                sq.exists()
        )
        
    antibodies = query.all()
    
    # load data needed on summary page
    batchLoadAttribute(antibodies, 'antigen')
    batchLoadAttribute(antibodies, 'antigen.source')
    batchLoadAttribute(antibodies, 'markers')
    batchLoadAttribute(antibodies, 'references')
    
    # sort antibodies in python, because we need the first marker symbol
    # and I'm not sure how to do that in SQLAlchemy
    _sort_antibodies(antibodies)
    
    return antibodies


def _sort_antibodies(antibodies):
    """
    Sort antibodies by
    first marker symbol, antibodyname, antibody ID
    """

    for antibody in antibodies:
        if antibody.markers:
            marker_symbols = [marker.symbol for marker in antibody.markers]
            marker_symbols.sort()
            antibody.first_marker_symbol = marker_symbols[0]
        else:
            antibody.first_marker_symbol = "ZZZ"
    
    antibodies.sort(key=lambda row: (row.first_marker_symbol, row.antibodyname, row.mgiid))

