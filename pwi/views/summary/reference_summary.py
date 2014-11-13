from flask import render_template, request, Response
from blueprint import summary
from pwi.util import error_template
from pwi.model.core import getColumnNames
from pwi.forms import ReferenceForm
from pwi.hunter import reference_hunter

# Routes
    
@summary.route('/reference',methods=['GET'])
def referenceSummary():

    # gather references
    form = ReferenceForm(request.args)
    references = form.queryReferences()

    return render_template("summary/reference/reference_summary.html", form=form, references=references)

@summary.route('/reference/download',methods=['GET'])
def markerTextReport():

    # gather references
    form = ReferenceForm(request.args)
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
        thisRefRow.append(ref.pubmedid)
        thisRefRow.append(ref.title)
        thisRefRow.append(ref.authors)
        thisRefRow.append(ref.journal)
        thisRefRow.append(str(ref.year))
        thisRefRow.append(ref.abstract)
        refsForDownload.append(thisRefRow)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in refsForDownload)

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=markerform_summary.txt"})
    