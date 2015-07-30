from flask import render_template, request, Response
from blueprint import summary
from pwi.hunter import probe_hunter
from mgipython.util import error_template,printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import ProbeForm

# Constants
PROBE_LIMIT = 2500

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
    headerRow.append("Probe ID")
    headerRow.append("Name")
    headerRow.append("Type")
    headerRow.append("Markers")
    headerRow.append("Marker IDs")
    headerRow.append("Aliases")
    headerRow.append("Organism")
    headerRow.append("Parent ID")
    headerRow.append("Parent Name")
    headerRow.append("J#s")
    probesForDownload.append(headerRow)
    
    for probe in probes:
        row = []
        row.append(probe.mgiid_object.accid)
        row.append(probe.name)
        row.append(probe.segmenttype)
        # marker symbols
        row.append(" | ".join([m.symbol for m in probe.markers_with_putatives]))
        # marker IDs
        row.append(" | ".join([m.mgiid for m in probe.markers_with_putatives]))
        # aliases
        row.append(" | ".join([a.alias for a in probe.aliases]))
        # organism
        row.append(probe.source.organism)
        # parent probe
        if probe.derivedfrom_probe:
            row.append(probe.derivedfrom_probe.mgiid)
            row.append(probe.derivedfrom_probe.name)
        else:
            row.append("")
            row.append("")
        # reference J#s
        row.append(" | ".join([r.jnumid for r in probe.references]))
        probesForDownload.append(row)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in probesForDownload)
    
    filename = "probe_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    