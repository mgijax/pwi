# Used to access marker related data
from mgipython.model import Assay, Marker, Reference, Allele, Accession, Probe, ProbePrep, Antibody, AntibodyPrep
from mgipython.modelconfig import db
from mgipython.model.query import batchLoadAttribute
from accession_hunter import getModelByMGIID

def getAssayByKey(key):
    return Assay.query.filter_by(_assay_key=key).first()

def getAssayByMGIID(id):
    id = id.upper()
    #return Assay.query.filter_by(mgiid=id).first()
    return getModelByMGIID(Assay, id)


def searchAssays(marker_id=None,
                 allele_id=None,
                 probe_id=None,
                 refs_id=None, 
                 antibody_id=None, 
                 limit=None):
    """
    Perform search for GXD Assay records by various parameters
    e.g. Marker nomen, Assay _refs_key
    
    ordered by Marker.symbol
    """
    
    query = Assay.query
    
    # join Marker + Reference for the order by clause
    query = query.join(Assay.marker)
    query = query.join(Assay.reference)
    
    if marker_id:
        # query Marker MGI ID
        query = query.filter(Marker.mgiid==marker_id)
        
    if allele_id:
        # query Allele MGI ID
        allele_accession = db.aliased(Accession)
        sub_assay = db.aliased(Assay)
        sq = db.session.query(sub_assay) \
                .join(sub_assay.alleles) \
                .join(allele_accession, Allele.mgiid_object) \
                .filter(allele_accession.accid==allele_id) \
                .filter(sub_assay._assay_key==Assay._assay_key) \
                .correlate(Assay)
            
        query = query.filter(
                sq.exists()
        )
        
    if probe_id:
        # query Probe MGI ID
        probe_accession = db.aliased(Accession)
        sub_assay = db.aliased(Assay)
        sq = db.session.query(sub_assay) \
                .join(sub_assay.probeprep) \
                .join(ProbePrep.probe) \
                .join(probe_accession, Probe.mgiid_object) \
                .filter(probe_accession.accid==probe_id) \
                .filter(sub_assay._assay_key==Assay._assay_key) \
                .correlate(Assay)
            
        query = query.filter(
                sq.exists()
        )

    if antibody_id:
        # query Antibody MGI ID
        antibody_accession = db.aliased(Accession)
        sub_assay = db.aliased(Assay)
        sq = db.session.query(sub_assay) \
                .join(sub_assay.antibodyprep) \
                .join(AntibodyPrep.antibody) \
                .join(antibody_accession, Antibody.mgiid_object) \
                .filter(antibody_accession.accid==antibody_id) \
                .filter(sub_assay._assay_key==Assay._assay_key) \
                .correlate(Assay)

        query = query.filter(
                sq.exists()
        )
        
            
    if refs_id:
        query = query.filter(Reference.jnumid==refs_id)
            
    query = query.order_by(Marker.symbol, 
                           Assay.assaytype_seq, 
                           Reference.authors,
                           Assay.mgiid)
    
    if limit:
        query = query.limit(limit)
        
    assays = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(assays, 'marker')
    batchLoadAttribute(assays, 'reference')
    
    return assays
    
    