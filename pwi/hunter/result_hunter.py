# Used to access allele related data
from pwi.model import Accession, Result, Marker, Reference, Assay, ADStructure
from pwi import db
from accession_hunter import getModelByMGIID


def searchResults(marker_id=None, refs_id=None, limit=None):

    # results to be returned
    results = []

    query = Result.query

    query = query.join(Result.marker)
    query = query.join(Result.assay)
    query = query.join(Result.structure)

            
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

    if refs_id:
        
        reference_accession = db.aliased(Accession)
        sub_result = db.aliased(Result)
        sq = db.session.query(sub_result) \
                .join(sub_result.reference) \
                .join(reference_accession, Reference.jnumid_object) \
                .filter(reference_accession.accid==refs_id) \
                .filter(sub_result._expression_key==Result._expression_key) \
                .correlate(Result)
            
        query = query.filter(
                sq.exists()
        )
                    
    # specific sort requested by GXD
    query = query.order_by(Result.isrecombinase, Marker.symbol, Assay._assaytype_key, Result.agemin, Result.agemax, ADStructure.toposort, Result.expressed)

    results = query.all()

    return results
