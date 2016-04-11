# Used to access GXD Assay Result data
from mgipython.model import Accession, Result, Marker, Reference, Assay, ADStructure, Specimen
from mgipython.modelconfig import db
from accession_hunter import getModelByMGIID
from mgipython.model.query import batchLoadAttribute


def searchResults(marker_id=None, 
                  refs_id=None, 
                  direct_structure_id=None,
                  limit=None):

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
        
    if direct_structure_id:
        
        structure_accession = db.aliased(Accession)
        sub_result = db.aliased(Result)
        sq = db.session.query(sub_result) \
                .join(sub_result.structure) \
                .join(structure_accession, ADStructure.mgiid_object) \
                .filter(structure_accession.accid==direct_structure_id) \
                .filter(sub_result._expression_key==Result._expression_key) \
                .correlate(Result)
            
        query = query.filter(
                sq.exists()
        )
                    
    # specific sorts requested by GXD
    if refs_id:
            # sort for reference summary
            # 1) Structure by TS then alpha
            # 2) Gene symbol
            # 3) assay type
            # 4) assay MGI ID
            # 5) Specimen label
            query = query.outerjoin(Result.specimen)
            query = query.order_by(Result.isrecombinase,
				   ADStructure._stage_key,
				   ADStructure.printname,
                                   Marker.symbol,
                                   Assay.assaytype_seq,
                                   Assay.mgiid,
                                   Specimen.specimenlabel
                                   )
    else:
            # default sort for all other types of summaries
            query = query.order_by(Result.isrecombinase, 
                           Marker.symbol, 
                           Assay.assaytype_seq,
                           ADStructure._stage_key, 
                           ADStructure.printname, 
                           Result.expressed)

    results = query.all()
    
    batchLoadAttribute(results, 'marker')
    batchLoadAttribute(results, 'structure')
    batchLoadAttribute(results, 'reference')
    batchLoadAttribute(results, 'assay')
    batchLoadAttribute(results, 'genotype')
    batchLoadAttribute(results, 'specimen')

    return results
