from flask import render_template, request, Response
from blueprint import summary
from pwi.hunter import probe_hunter
from pwi.util import error_template,printableTimeStamp
from pwi.model.core import getColumnNames
from pwi.forms import ProbeForm

# Constants
PROBE_LIMIT = 5000

# Routes
    
@summary.route('/probe',methods=['GET'])
def probeSummary():

    global PROBE_LIMIT

    # gather probes
    form = ProbeForm(request.args)
    if 'probe_limit' not in request.args:
        form.probe_limit.data = PROBE_LIMIT
        
    return renderProbeSummary(form)

@summary.route('/probe/download',methods=['GET'])
def probeSummaryDownload():

    # gather probes
    form = ProbeForm(request.args)
    
    return renderProbeSummaryDownload(form)


# Helpers

def renderProbeSummary(form):
    
    probes = form.queryProbes()
    
    probesTruncated = form.probe_limit.data and \
            (len(probes) >= PROBE_LIMIT)

    return render_template("summary/probe/probe_summary.html", 
                           form=form, 
                           probes=probes, 
                           probesTruncated=probesTruncated,
                           queryString=form.argString())
    
    
def renderProbeSummaryDownload(form):
    
    probes = form.queryProbes()

    # list of data rows
    probesForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("Probe MGIID")
    headerRow.append("Name")
    headerRow.append("Segment Type")
    headerRow.append("Markers")
    headerRow.append("Chromosome")
    probesForDownload.append(headerRow)
    
    for probe in probes:
        row = []
        row.append(probe.mgiid)
        row.append(probe.name)
        row.append(probe.segmenttype)
        # use symbol for list of markers
        row.append(", ".join([m.symbol for m in probe.markers]))
        row.append(probe.chromosome)
        probesForDownload.append(row)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in probesForDownload)
    
    filename = "probe_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    