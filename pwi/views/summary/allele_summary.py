from flask import render_template, request, Response
from .blueprint import summary
from pwi.hunter import allele_hunter
from mgipython.util import error_template
from mgipython.model.core import getColumnNames
from mgipython.model import Allele
from pwi.forms import AlleleForm
from mgipython.util import printableTimeStamp

# Constants
ALLELE_LIMIT = 1000

# Routes
    
@summary.route('/allele',methods=['GET'])
def alleleSummary():
    
    # get form params
    form = AlleleForm(request.args)
    if 'allele_limit' not in request.args:
        form.allele_limit.data = ALLELE_LIMIT
    
    return renderAlleleSummary(form)

@summary.route('/allele/download',methods=['GET'])
def alleleSummaryDownload():

    # gather references
    form = AlleleForm(request.args)
    
    return renderAlleleSummaryDownload(form)

    
# Helpers
    
def renderAlleleSummary(form):
    
    # transform into the summary format we want
    alleles = form.queryAlleles()
    
     # check if results have been truncated by default limits
    allelesTruncated = form.allele_limit.data and \
            (len(alleles) >= form.allele_limit.data)
        
    return render_template("summary/allele/allele_summary.html",
                           alleles=alleles,
                           form=form,
                           queryString=form.argString(),
                           allelesTruncated=allelesTruncated)
    
    
def renderAlleleSummaryDownload(form):
    
    alleles = form.queryAlleles()

    # list of data rows
    allelesForDownload = []

    # add header
    headerRow = []
    headerRow.append("Symbol")
    headerRow.append("MGI ID")
    headerRow.append("Name")
    headerRow.append("Synonyms")
    headerRow.append("Transmission")
    headerRow.append("AlleleStatus")
    headerRow.append("Generation Type")
    headerRow.append("Attributes")
    headerRow.append("MP Annotations")
    headerRow.append("Disease Annotations")
    allelesForDownload.append(headerRow)
    
    for allele in alleles:
        alleleRow = []
        alleleRow.append(allele.symbol)
        alleleRow.append(allele.mgiid)
        alleleRow.append(allele.name)
        alleleRow.append(",".join([str(s) for s in allele.synonyms]))
        alleleRow.append(allele.transmission)
        alleleRow.append(allele.status)
        alleleRow.append(allele.alleletype)
        alleleRow.append(",".join([str(s) for s in allele.subtypes]))
        alleleRow.append(allele.summary_mp_display)
        alleleRow.append(",".join(allele.disease_terms))
        allelesForDownload.append(alleleRow)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in allelesForDownload)
    
    filename = "allele_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    
