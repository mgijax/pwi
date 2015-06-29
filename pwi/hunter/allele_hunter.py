# Used to access allele related data
from pwi.model import Allele, Reference, Marker, Assay, VocAnnot, Accession
from pwi import db,app
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists
from pwi.util import batch_list
from pwi.model.query import performQuery
from sqlalchemy import orm
from accession_hunter import getModelByMGIID

def getAlleleByKey(key):
    allele = Allele.query.filter_by(_allele_key=key).first()
    return allele

def getAlleleByMGIID(id):
    id = id.upper()
    #allele = Allele.query.filter_by(mgiid=id).first()
    allele = getModelByMGIID(Allele, id)
    return allele

def searchAlleles(refs_id=None, 
                  marker_id=None,
                  assay_id=None, 
                  limit=None):
    """
    Perform search for Alleles
    """
    query = Allele.query
    
            
    if assay_id:
        query = query.filter(
                Allele.assays.any(Assay.mgiid==assay_id)
        )
  
    if marker_id:
        query = query.join(Allele.marker)
        marker_accession = db.aliased(Accession)
        query = query.join(marker_accession, Marker.mgiid_object)
        query = query.filter(
                marker_accession.accid==marker_id
        )

    if refs_id:
        jnum_accession = db.aliased(Accession)
        sub_allele = db.aliased(Allele)
        sq = db.session.query(sub_allele) \
                .join(sub_allele.explicit_references) \
                .join(jnum_accession, Reference.jnumid_object) \
                .filter(jnum_accession.accid==refs_id) \
                .filter(sub_allele._allele_key==Allele._allele_key) \
                .correlate(Allele)
            
        query = query.filter(
                sq.exists()
        )
        
    query = query.order_by(Allele.transmission.desc(), Allele.status, Allele.symbol)
    
    if limit:
        query = query.limit(limit)
     
    alleles = query.all()
    
    # load attributes needed on summary
    batchLoadAttribute(alleles, "mp_annots")
    batchLoadAttribute(alleles, "disease_annots")
    batchLoadAttribute(alleles, "subtypes")
    batchLoadAttribute(alleles, "synonyms")
    
    return alleles

def doesAlleleHavePheno(alleleKey):
    """
    Returns true or false if allele has any phenotype data
    """
    
    existsSQL = '''
    select 1 where exists (
        select 1 from gxd_allelegenotype ag join 
            voc_annot va on (
                va._object_key=ag._genotype_key
                and va._annottype_key=%d
            ) 
        where ag._allele_key=%d
    )
    ''' % (Allele._mp_annottype_key, alleleKey)
    
    results, col_defs = performQuery(existsSQL)

    return len(results) > 0

def doesAlleleHaveAssays(alleleKey):
    """
    Returns true or false if allele has any expression assay data
    """
    
    existsSQL = '''
    select 1 where exists (
        select 1 from gxd_allelegenotype ag join 
            gxd_gellane gl on (
                gl._genotype_key=ag._genotype_key
            ) 
        where ag._allele_key=%d
    )
    or exists (
        select 1 from gxd_allelegenotype ag join 
            gxd_specimen s on (
                s._genotype_key=ag._genotype_key
            ) 
        where ag._allele_key=%d
    )
    ''' % (alleleKey, alleleKey)
    
    results, col_defs = performQuery(existsSQL)

    return len(results) > 0

# helpers

        
        
