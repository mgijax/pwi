from flask import render_template, request, Response
from blueprint import summary
from pwi.util import error_template, printableTimeStamp
from pwi.model.core import getColumnNames
from pwi.forms import GXDForm
from pwi.util.gxdindex import gxdindex_aggregator

# Constants
ASSAY_LIMIT = 5000
INDEX_LIMIT = 5000

# Routes
    
@summary.route('/assay',methods=['GET'])
def gxdAssaySummary():
    global ASSAY_LIMIT
    
    # get form params
    form = GXDForm(request.args)
    if 'assay_limit' not in request.args:
        form.assay_limit.data = ASSAY_LIMIT
    
    return renderAssaySummary(form)

@summary.route('/assay/download',methods=['GET'])
def gxdAssaySummaryDownload():

    # gather references
    form = GXDForm(request.args)
    
    return renderAssaySummaryDownload(form)


@summary.route('/gxdindex',methods=['GET'])
def gxdIndexSummary():
    global INDEX_LIMIT
    
    # get form params
    form = GXDForm(request.args)
    if 'index_limit' not in request.args:
        form.index_limit.data = INDEX_LIMIT
    
    return renderIndexSummary(form)
    
    
# Helpers
    
def renderAssaySummary(form):
    
    assays = form.queryAssays()
    
    # check if results have been truncated by default limits
    assayTruncated = form.assay_limit.data and \
            (len(assays) >= form.assay_limit.data)
    
    return render_template("summary/assay/assay_summary.html",
                           assays=assays,
                           assayTruncated=assayTruncated,
                           form=form,
                           queryString=form.argString())
    
def renderIndexSummary(form):
    
    results = form.queryIndexRecords()
    
    # check if results have been truncated by default limits
    resultsTruncated = form.index_limit.data and \
            (len(results) >= form.index_limit.data)
            
    countSummary = gxdindex_aggregator.aggregateGenesByAssayAndStage(results)
    
    return render_template("summary/gxdindex/gxdindex_summary.html",
                           indexRecords=results,
                           resultsTruncated=resultsTruncated,
                           countSummary=countSummary,
                           form=form,
                           queryString=form.argString())
    

def renderAssaySummaryDownload(form):
    
    assays = form.queryAssays()

    # list of data rows
    assaysForDownload = []

    # add header
    headerRow = []
    headerRow.append("Assay ID")
    headerRow.append("Gene")
    headerRow.append("Gene MGI ID")
    headerRow.append("Assay Type")
    headerRow.append("Reference J#")
    headerRow.append("Short Citation")
    assaysForDownload.append(headerRow)
    
    for assay in assays:
        assayRow = []
        assayRow.append(assay.mgiid)
        assayRow.append(assay.marker.symbol)
        assayRow.append(assay.marker.mgiid)
        assayRow.append(assay.assaytype)
        assayRow.append(assay.reference.jnumid)
        assayRow.append(assay.reference.short_citation)
        assaysForDownload.append(assayRow)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in assaysForDownload)
    
    filename = "gxd_assay_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})