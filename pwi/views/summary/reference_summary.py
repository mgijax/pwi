from flask import render_template, request, Response
from blueprint import summary
from pwi.util import error_template, printableTimeStamp
from pwi.model.core import getColumnNames
from pwi.forms import ReferenceForm
from pwi.hunter import reference_hunter
from pwi.model.query import batchLoadAttributeExists
from pwi import app

# Constants
REF_LIMIT = 500
    
@summary.route('/reference',methods=['GET'])
def referenceSummary():

    global REF_LIMIT
    
    # save query string
    queryString = request.query_string

    # gather references
    form = ReferenceForm(request.args)
    form.reference_limit.data = REF_LIMIT
    references = form.queryReferences()
    
    # load any exists attributes for associated data links
    batchLoadAttributeExists(references, ['explicit_markers', 'expression_assays'])
    
    referencesTruncated = len(references) >= REF_LIMIT

    return render_template("summary/reference/reference_summary.html", 
                           form=form, 
                           references=references, 
                           referencesTruncated=referencesTruncated,
                           queryString=queryString)

@summary.route('/reference/download',methods=['GET'])
def referenceSummaryDownload():

    # gather references
    form = ReferenceForm(request.args)
    
    return renderReferenceSummaryDownload(form)


# Helpers

def renderReferenceSummaryDownload(form):
    
    references = form.queryReferences()

    # list of data rows
    refsForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("J:#")
    headerRow.append("PubMed ID")
    headerRow.append("Title")
    headerRow.append("Authors")
    headerRow.append("Journal")
    headerRow.append("Year")
    headerRow.append("Abstract")
    refsForDownload.append(headerRow)
    
    for ref in references:
        thisRefRow = []
        thisRefRow.append(ref.jnumid)
        thisRefRow.append(ref.pubmedid or '')
        thisRefRow.append(ref.title or '')
        thisRefRow.append(ref.authors or '')
        thisRefRow.append(ref.journal or '')
        thisRefRow.append(str(ref.year))
        thisRefRow.append(ref.abstract or '')
        refsForDownload.append(thisRefRow)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in refsForDownload)
    
    filename = "reference_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    