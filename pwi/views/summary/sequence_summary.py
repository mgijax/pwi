from flask import render_template, request, Response
from blueprint import summary
from pwi.hunter import sequence_hunter
from mgipython.util import error_template,printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import SequenceForm

# Constants
SEQUENCE_LIMIT = 5000

# Routes
    
@summary.route('/sequence',methods=['GET'])
def sequenceSummary():

    global SEQUENCE_LIMIT

    # gather experiments
    form = SequenceForm(request.args)
    if 'sequence_limit' not in request.args:
        form.sequence_limit.data = SEQUENCE_LIMIT
        
    return renderSequenceSummary(form)

@summary.route('/sequence/download',methods=['GET'])
def sequenceSummaryDownload():

    # gather experiments
    form = SequenceForm(request.args)
    
    return renderSequenceSummaryDownload(form)


# Helpers

def renderSequenceSummary(form):
    
    sequences = form.querySequences()
    
    sequencesTruncated = form.sequence_limit.data and \
            (len(sequences) >= SEQUENCE_LIMIT)

    return render_template("summary/sequence/sequence_summary.html", 
                           form=form, 
                           sequences=sequences, 
                           sequencesTruncated=sequencesTruncated,
                           queryString=form.argString())
    
    
def renderSequenceSummaryDownload(form):
    
    sequences = form.querySequences()

    # list of data rows
    sequencesForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("ID")
    headerRow.append("Type")
    headerRow.append("Length")
    headerRow.append("Strain/Species")
    headerRow.append("Description")
    headerRow.append("Marker Symbols")
    sequencesForDownload.append(headerRow)
    
    for sequence in sequences:
        row = []
        row.append(" | ".join([a.accid for a in sequence.accession_objects]))
        row.append(sequence.type)
        row.append(str(sequence.length))
        row.append(sequence.source.strain.strain)
        row.append(sequence.description)
        row.append(" | ".join([m.symbol for m in sequence.markers]))
        sequencesForDownload.append(row)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in sequencesForDownload)
    
    filename = "sequence_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    