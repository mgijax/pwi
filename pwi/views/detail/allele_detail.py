from flask import render_template
from blueprint import detail
from pwi.hunter import allele_hunter
from pwi.hunter import genotype_mp_hunter
from pwi.hunter import image_hunter
from pwi.util import error_template
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
    return renderAlleleDetail()
    
    return error_template('No allele found for ID = %s' % id)


@detail.route('/allele/genotype/<int:alleleKey>')
def genotypeDetail(alleleKey):
    allele = allele_hunter.getAlleleByKey(alleleKey)
    if allele:
        genotype_mp_hunter.loadPhenotypeData(allele.genotypes)
        return render_template('detail/allele_genotypes.html',
                               allele = allele)
    return error_template('No allele found for _allele_key = %d' % key)

# Helpers

def renderAlleleDetail(allele):
    
    # gather other objects for this allele
    molecularimage = image_hunter.getImageByMGIID(allele.molecularimageid)

    return render_template('detail/allele_detail.html', allele = allele, molecularimage = molecularimage)
