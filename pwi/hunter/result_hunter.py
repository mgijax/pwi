# Used to access allele related data
from pwi.model import Accession, Result, Marker, Reference
from pwi import db
from accession_hunter import getModelByMGIID


def searchResults(marker_id=None, limit=None):

    query = Result.query

    results = []
            
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_result = db.aliased(Result)
        sq = db.session.query(sub_result) \
                .join(sub_result.marker) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_result._expression_key==Result._expression_key) \
                .correlate(Result)
            
        query = query.filter(
                sq.exists()
        )
                    
    results = query.all()

    return results
