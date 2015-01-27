from flask import render_template, request, Response
from blueprint import summary
from pwi.hunter import antibody_hunter
from pwi.util import error_template,printableTimeStamp
from pwi.model.core import getColumnNames
from pwi.forms import AntibodyForm

# Constants
ANTIBODY_LIMIT = 5000

# Routes
    
@summary.route('/antibody',methods=['GET'])
def antibodySummary():

    global ANTIBODY_LIMIT

    # gather antibodys
    form = AntibodyForm(request.args)
    if 'antibody_limit' not in request.args:
        form.antibody_limit.data = ANTIBODY_LIMIT
        
    return renderAntibodySummary(form)

@summary.route('/antibody/download',methods=['GET'])
def antibodySummaryDownload():

    # gather antibodys
    form = AntibodyForm(request.args)
    
    return renderAntibodySummaryDownload(form)


# Helpers

def renderAntibodySummary(form):
    
    antibodies = form.queryAntibodies()
    
    antibodiesTruncated = form.antibody_limit.data and \
            (len(antibodies) >= ANTIBODY_LIMIT)

    return render_template("summary/antibody/antibody_summary.html", 
                           form=form, 
                           antibodies=antibodies, 
                           antibodiesTruncated=antibodiesTruncated,
                           queryString=form.argString())
    
    
def renderAntibodySummaryDownload(form):
    
    antibodies = form.queryAntibodies()

    # list of data rows
    antibodiesForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("Antibody MGIID")
    headerRow.append("Name")
    headerRow.append("Type")
    headerRow.append("Markers")
    headerRow.append("Reference")
    antibodiesForDownload.append(headerRow)
    
    for antibody in antibodies:
        row = []
        row.append(antibody.mgiid)
        row.append(antibody.antibodyname)
        row.append(antibody.antibodytype)
        
        # use symbol for list of markers
        row.append(", ".join([m.symbol for m in antibody.markers]))
        row.append("%s, %s" % (antibody.reference.jnumid, antibody.reference.short_citation))
        antibodiesForDownload.append(row)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in antibodiesForDownload)
    
    filename = "antibody_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    