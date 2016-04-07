# Used to access marker related data
from mgipython.model import Specimen, Assay, Marker, Reference, Accession
from mgipython.modelconfig import db

def searchSpecimens(jnum=None, 
                 limit=None):
    """
    Search for assay records (specific to specimen summary)
    
    """
    
    # join Marker + Reference for the order by clause
    #query = query.join(Assay.reference)
    query = Specimen.query
    query = query.join(Specimen.assay)
    query = query.join(Assay.marker)

    if jnum:
        ref_accession = db.aliased(Accession)
        sub_specimen = db.aliased(Specimen)
        sq = db.session.query(sub_specimen) \
            .join(sub_specimen.assay) \
            .join(Assay.reference) \
            .join(ref_accession, Reference.jnumid_object) \
            .filter(ref_accession.accid==jnum) \
            .filter(sub_specimen._specimen_key==Specimen._specimen_key) \
            .correlate(Specimen)
    
        query = query.filter(
            sq.exists()
        )
            
    
    query = query.order_by(Specimen.specimenlabel, Marker.symbol, Assay.mgiid)
    
    if limit:
        query = query.limit(limit)
        
    specimens = query.all()
        
    return specimens
