# Used to access GXD Assay Result data
from mgipython.model import Accession, Result, Marker, Reference, Assay, VocTerm, Specimen
from mgipython.modelconfig import db
from accession_hunter import getModelByMGIID
from mgipython.model.query import batchLoadAttribute


def searchResults(marker_id=None, 
                  refs_id=None, 
                  direct_structure_id=None,
                  limit=None):

    # results to be returned
    results = []

    query = _buildResultQuery(marker_id, 
                              refs_id, 
                              direct_structure_id)
                    

    results = query.all()
    
    batchLoadAttribute(results, 'marker')
    batchLoadAttribute(results, 'structure')
    batchLoadAttribute(results, 'reference')
    batchLoadAttribute(results, 'assay')
    batchLoadAttribute(results, 'genotype')
    batchLoadAttribute(results, 'specimen')

    return results


def getResultCount(direct_structure_id):
    """
    Get count of results for the direct_structure_id
    """

    query = _buildResultQuery(direct_structure_id=direct_structure_id)
    
    query = query.statement.with_only_columns([db.func.count()]).order_by(None)
    count = db.session.execute(query).scalar()
    return count
    
    
    
def _buildResultQuery(marker_id=None, 
                  refs_id=None, 
                  direct_structure_id=None):
    """
    Build query statement for GXD expression results
    """
    query = Result.query

    query = query.join(Result.marker)
    query = query.join(Result.assay)
    emapa_structure = db.aliased(VocTerm)
    query = query.join(emapa_structure, Result.structure)

            
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
        
        # I.e. an EMAPA ID
        
        if "EMAPS" in direct_structure_id:
            
            # convert EMAPS to EMAPA + stage
            stage = int(direct_structure_id[-2:])
            direct_structure_id = direct_structure_id[:-2].replace("EMAPS","EMAPA")
            
            query = query.filter(Result._stage_key==stage)
        
        structure_accession = db.aliased(Accession)
        sub_result = db.aliased(Result)
        sq = db.session.query(sub_result) \
                .join(sub_result.structure) \
                .join(structure_accession, VocTerm.primaryid_object) \
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
                                   Result._stage_key,
                                   emapa_structure.term,
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
                           Result._stage_key, 
                           emapa_structure.term, 
                           Result.expressed)
    
    
    
    return query
