# Used to access sequence data
from mgipython.model import Accession, Sequence, Marker, Reference
from mgipython.modelconfig import db
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeExists, performQuery
from .accession_hunter import getModelByMGIID


def searchSequences(marker_id=None,
                  limit=None):
    """
    Perform search for Sequence records by marker_id
    
    ordered by Sequence._sequence_key
    """
    
    query = Sequence.query
    
    
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_seq = db.aliased(Sequence)
        sq = db.session.query(sub_seq) \
                .join(sub_seq.markers) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_seq._sequence_key==Sequence._sequence_key) \
                .correlate(Sequence)
            
        query = query.filter(
                sq.exists()
        )
            
            
    query = query.order_by(Sequence._sequence_key)
    
    if limit:
        query = query.limit(limit)
        
    sequences = query.all()
    
    # load any necessary data for summary
    batchLoadAttribute(sequences, 'markers')
    batchLoadAttribute(sequences, 'accession_objects')
    batchLoadAttribute(sequences, 'source')
    batchLoadAttribute(sequences, 'source.strain')
    
    return sequences

    
