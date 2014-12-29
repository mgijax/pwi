# Used to access allele related data
from pwi.model import Allele, Reference, Marker, Assay, VocAnnot, Accession
from pwi import db,app
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists
from pwi.util import batch_list
from pwi.model.query import performQuery
from sqlalchemy import orm

def getAlleleByKey(key):
    allele = Allele.query.filter_by(_allele_key=key).first()
    return allele

def getAlleleByMGIID(id):
    id = id.upper()
    allele = Allele.query.filter_by(mgiid=id).first()
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
    if app.config["DBTYPE"] == 'Sybase':
        # TODO (kstone): remove this after flip
        # this is to get around the wicked slow views in sybase.
        # In postgres, using views shouldn't be too bad
        populateAlleleMPAnnots(alleles)
        populateAlleleDiseaseAnnots(alleles)
    else:
        batchLoadAttribute(alleles, "mp_annots")
        batchLoadAttribute(alleles, "disease_annots")
    batchLoadAttribute(alleles, "subtypes")
    batchLoadAttribute(alleles, "synonyms")
    
    return alleles



# helpers

def populateAlleleMPAnnots(alleles):
    """
    Loading mp annotations for an allele
    via raw SQL.
    
    TODO (kstone): this needs to be pulled once we switch
    off sybase, since sqlalchemy relationships are preferred.
    """
    alleleMap = {}
    for allele in alleles:
        alleleMap[allele._allele_key] = allele
        
    keys = [str(k) for k in alleleMap.keys()]
    
    # fetch annots by _allele_key
    
    annotMap = {}
    for batch in batch_list(keys, 100):
        
        # get annot keys
        annotQuery = """
            select _allele_key_1 _allele_key,
                va._term_key,
                term.term, 
                va._qualifier_key,
                qualifier.term as qualifier,
                va._annottype_key
            from gxd_allelepair ap join
            voc_annot va on (va._object_key = ap._genotype_key and va._annottype_key=%d) join
            voc_term term on (term._term_key = va._term_key) join
            voc_term qualifier on (qualifier._term_key = va._qualifier_key)
            where ap._allele_key_1 in (%s)
            union
            select _allele_key_2 _allele_key, 
                va._term_key,
                term.term, 
                va._qualifier_key,
                qualifier.term as qualifier,
                va._annottype_key
            from gxd_allelepair ap join
            voc_annot va on (va._object_key = ap._genotype_key and va._annottype_key=%d) join
            voc_term term on (term._term_key = va._term_key) join
            voc_term qualifier on (qualifier._term_key = va._qualifier_key)
            where ap._allele_key_2 in (%s)
            
        """ % (Allele._mp_annottype_key,
               ",".join(batch),
               Allele._mp_annottype_key,
               ",".join(batch))
        
        # resolve into objects
        results, col_defs = performQuery(annotQuery)
        for result in results:
            annot = VocAnnot()
            annot._object_key = result[0]
            annot._term_key = result[1]
            annot.term = result[2]
            annot._qualifier_key = result[3]
            annot.qualifier = result[4]
            annot._annottype_key = result[5]
            annotMap.setdefault(annot._object_key, []).append(annot)
        
    for _allele_key, allele in alleleMap.items():
        annots = []
        if _allele_key in annotMap:
            annots = annotMap[_allele_key]
            
        orm.attributes.set_committed_value(allele, "mp_annots", annots)
        
        
def populateAlleleDiseaseAnnots(alleles):
    """
    Loading Disease annotations for an allele
    via raw SQL.
    
    TODO (kstone): this needs to be pulled once we switch
    off sybase, since sqlalchemy relationships are preferred.
    """
    alleleMap = {}
    for allele in alleles:
        alleleMap[allele._allele_key] = allele
        
    keys = [str(k) for k in alleleMap.keys()]
    
    # fetch annots by _allele_key
    
    annotMap = {}
    for batch in batch_list(keys, 100):
        
        # get annot keys
        annotQuery = """
            select _allele_key_1 _allele_key,
                va._term_key,
                term.term, 
                va._qualifier_key,
                qualifier.term as qualifier,
                va._annottype_key
            from gxd_allelepair ap join
            voc_annot va on (va._object_key = ap._genotype_key and va._annottype_key=%d) join
            voc_term term on (term._term_key = va._term_key) join
            voc_term qualifier on (qualifier._term_key = va._qualifier_key)
            where ap._allele_key_1 in (%s)
            union
            select _allele_key_2 _allele_key,
                va._term_key,
                term.term, 
                va._qualifier_key,
                qualifier.term as qualifier,
                va._annottype_key
            from gxd_allelepair ap join
            voc_annot va on (va._object_key = ap._genotype_key and va._annottype_key=%d) join
            voc_term term on (term._term_key = va._term_key) join
            voc_term qualifier on (qualifier._term_key = va._qualifier_key)
            where ap._allele_key_2 in (%s)
            union
            select va._object_key _allele_key,
                va._term_key,
                term.term, 
                va._qualifier_key,
                qualifier.term as qualifier,
                va._annottype_key
            from voc_annot va join
            voc_term term on (term._term_key = va._term_key) join
            voc_term qualifier on (qualifier._term_key = va._qualifier_key)
            where va._annottype_key=%d
                and va._object_key in (%s)
            
        """ % (Allele._disease_geno_anottype_key,
               ",".join(batch),
               Allele._disease_geno_anottype_key,
               ",".join(batch),
               Allele._disease_allele_annottype_key,
               ",".join(batch))
        
        # resolve into objects
        results, col_defs = performQuery(annotQuery)
        for result in results:
            annot = VocAnnot()
            annot._object_key = result[0]
            annot._term_key = result[1]
            annot.term = result[2]
            annot._qualifier_key = result[3]
            annot.qualifier = result[4]
            annot._annottype_key = result[5]
            annotMap.setdefault(annot._object_key, []).append(annot)
        
    for _allele_key, allele in alleleMap.items():
        annots = []
        if _allele_key in annotMap:
            annots = annotMap[_allele_key]
            
        orm.attributes.set_committed_value(allele, "disease_annots", annots)
        
        