from flask import render_template, request, Response
from .blueprint import summary
from mgipython.util import error_template, printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import GXDForm
from mgipython.util.gxdindex import gxdindex_aggregator
from pwi.hunter import marker_hunter
from mgipython.service.reference_service import ReferenceService

reference_service = ReferenceService()

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
    
    # default return values
    reference = None
    refSortedIndexRecords = None
    marker = None
    template = "gxdindex_summary"

    # gather index records from the DB
    indexRecords = form.queryIndexRecords()
    
    # check for truncation by default limits
    resultsTruncated = form.index_limit.data and \
            (len(indexRecords) >= form.index_limit.data)
            
    # generate age/assay count table
    countSummary = gxdindex_aggregator.aggregateGenesByAssayAndStage(indexRecords)
    
    # send to lit-index by reference, if passed a ref ID
    if form.refs_id.data:
        reference = reference_service.get_by_jnum_id(form.refs_id.data)
        template = "gxdindex_summary_by_ref"

    # send to lit-index by marker, if passed a marker ID
    if form.marker_id.data:
        
        # re-order indexRecords - this page has specific sort
        indexRecords.sort(key=lambda r: r.reference.short_citation)
        
        marker = marker_hunter.getMarkerByMGIID(form.marker_id.data)
        template = "gxdindex_summary_by_marker"
        
    # send to lit-index by age / assay, if passed age and assay_type
    if form.age.data and form.assay_type.data:
        template = "gxdindex_summary_by_age_assay"
    
    return render_template("summary/gxdindex/%s.html" % template,
                           indexRecords=indexRecords,
                           resultsTruncated=resultsTruncated,
                           countSummary=countSummary,
                           reference=reference,
                           marker=marker,
                           form=form,
                           queryString=form.argString())
    
    
def renderIndexSummaryByAge(form):
    
    
    indexRecords = form.queryIndexRecords()
  
    reference = reference_service.get_by_jnum_id(form.refs_id.data)
    
    return render_template("summary/gxdindex/by_age_assay_summary.html",
                           reference=reference,
                           indexRecords=indexRecords)
    

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