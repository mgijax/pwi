# Used to access gxdindex related data
from mgipython.model import GxdIndexRecord, Marker, Reference, Accession, GxdIndexStage
from mgipython.modelconfig import db
from mgipython.model.query import batchLoadAttribute


def searchIndexRecords(marker_id=None, 
                       refs_id=None,
                       age=None,
                       assay_type=None,
                       limit=None):

    # results to be returned
    results = []

    query = GxdIndexRecord.query

    query = query.join(GxdIndexRecord.marker)
    #query = query.join(GxdIndexRecord.reference)

            
    if marker_id:
        
        marker_accession = db.aliased(Accession)
        sub_result = db.aliased(GxdIndexRecord)
        sq = db.session.query(sub_result) \
                .join(sub_result.marker) \
                .join(marker_accession, Marker.mgiid_object) \
                .filter(marker_accession.accid==marker_id) \
                .filter(sub_result._index_key==GxdIndexRecord._index_key) \
                .correlate(GxdIndexRecord)
            
        query = query.filter(
                sq.exists()
        )

    if refs_id:
        
        reference_accession = db.aliased(Accession)
        sub_result = db.aliased(GxdIndexRecord)
        sq = db.session.query(sub_result) \
                .join(sub_result.reference) \
                .join(reference_accession, Reference.jnumid_object) \
                .filter(reference_accession.accid==refs_id) \
                .filter(sub_result._index_key==GxdIndexRecord._index_key) \
                .correlate(GxdIndexRecord)
            
        query = query.filter(
                sq.exists()
                )


    if age:
            query = query.filter(
                GxdIndexRecord.indexstages.any(
                        GxdIndexStage.stageid==age
                ))


    if assay_type:
            query = query.filter(
                GxdIndexRecord.indexstages.any(
                        GxdIndexStage.indexassay==assay_type
                ))
                    
    query = query.order_by(Marker.symbol, GxdIndexRecord._index_key)

    if limit:
            query = query.limit(limit)
        
    results = query.all()
    
    batchLoadAttribute(results, 'marker')
    batchLoadAttribute(results, 'reference')
    batchLoadAttribute(results, 'indexstages')

    return results
