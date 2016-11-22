from flask import render_template
from blueprint import detail
from pwi.hunter import allele_hunter
from pwi.hunter import genotype_hunter
from pwi.hunter import genotype_mp_hunter
from pwi.hunter import image_hunter
from mgipython.util import error_template
from mgipython.model.query import batchLoadAttribute, batchLoadAttributeExists
from pwi import app

# Routes

@detail.route('/allele/key/<int:key>')
def alleleDetailByKey(key):
    allele = allele_hunter.getAlleleByKey(key)
    if allele:
        return renderAlleleDetail(allele)
    return error_template('No allele found for _allele_key = %d' % key)
    
@detail.route('/allele/<string:id>')
def alleleDetailById(id):
    allele = allele_hunter.getAlleleByMGIID(id)
    if allele:
        return renderAlleleDetail(allele)
    
    return error_template('No allele found for ID = %s' % id)



@detail.route('/allele/genotype/sub/<int:alleleKey>')
def subGenotypeDetail(alleleKey):
    """
    This only loads the sub_alleles_genotypes template (no styles).
    It is intended to be inserted into an existing page.
    Use the 'allele/genotype/debug/' url below for debugging
        and development.
    """
    allele = allele_hunter.getAlleleByKey(alleleKey)
    return renderGenotypeDetailForAllele(allele, 'detail/genotype/sub_allele_genotypes.html')

@detail.route('/allele/genotype/debug/<int:alleleKey>')
def _debugGenotypeDetail(alleleKey):
    """
    This url is for debugging the allele phenotype by genotype
        section as a standalone page (with header and styles)
    """
    allele = allele_hunter.getAlleleByKey(alleleKey)
    return renderGenotypeDetailForAllele(allele, 'detail/genotype/genotype_detail.html')

@detail.route('/allele/genotype/key/<int:genotypeKey>')
def genotypeDetailByKey(genotypeKey):
    """
    Same as all genotype summary for Allele, but renders
        only the one genotype
    """
    genotype = genotype_hunter.getGenotypeByKey(genotypeKey)
    if genotype:
        return renderGenotypeDetailForGenotype(genotype)
    return error_template('No genotype found for key = %s' % genotypeKey)

@detail.route('/allele/genotype/<string:genotypeId>')
def genotypeDetailById(genotypeId):
    """
    Same as all genotype summary for Allele, but renders
        only the one genotype
    """
    genotype = genotype_hunter.getGenotypeByMGIID(genotypeId)
    if genotype:
        return renderGenotypeDetailForGenotype(genotype)
    return error_template('No genotype found for ID = %s' % genotypeId)



# Helpers
def renderGenotypeDetailForAllele(allele, templateName):
    """
    render detail of all genotypes for an allele
    """
    
    return _renderGenotypeDetail(allele.genotypes_with_phenotypes, templateName)

def renderGenotypeDetailForGenotype(genotype):
    """
    render detail of only one genotype
    """
    return _renderGenotypeDetail([genotype], 'detail/genotype/genotype_detail.html')
    
def _renderGenotypeDetail(genotypes, templateName):
    """
    Generic genotype MP/Disease summary
    """
    
    # pre-fetch all the evidence and note records
    batchLoadAttribute(genotypes, 'primaryimagepane')
    
    batchLoadAttribute(genotypes, 'mp_annots')
    batchLoadAttribute(genotypes, 'mp_annots.evidences')
    batchLoadAttribute(genotypes, 'mp_annots.evidences.notes')
    batchLoadAttribute(genotypes, 'mp_annots.evidences.properties')
    batchLoadAttribute(genotypes, 'mp_annots.evidences.notes.chunks')
    
    batchLoadAttribute(genotypes, 'disease_annots')
    batchLoadAttribute(genotypes, 'disease_annots.evidences')
    batchLoadAttribute(genotypes, 'disease_annots.term_object')
    
    batchLoadAttribute(genotypes, 'disease_annots_do')
    batchLoadAttribute(genotypes, 'disease_annots_do.evidences')
    batchLoadAttribute(genotypes, 'disease_annots_do.term_object')
    
    # load the phenotype specific information and organize it 
    # into mp_headers objects    
    genotype_mp_hunter.loadPhenotypeData(genotypes)
    
    return render_template(templateName,
                           genotypes = genotypes)


def renderAlleleDetail(allele):
    
    # gather other objects for this allele
    molecularimage = None
    if allele.molecularimageid:
        molecularimage = image_hunter.getImageByMGIID(allele.molecularimageid)
    
    # detect if allele has phenotype data
    hasPheno = allele_hunter.doesAlleleHavePheno(allele._allele_key)
    
    hasAssays = allele_hunter.doesAlleleHaveAssays(allele._allele_key)
    
    # load has_explicit_references, and has_assays existence properties for links
    batchLoadAttributeExists([allele], ['explicit_references'])

    return render_template('detail/allele_detail.html', 
                           allele = allele, 
                           molecularimage = molecularimage,
                           hasPheno = hasPheno,
                           hasAssays = hasAssays)
