from flask import render_template, request, Response
from .blueprint import summary
from pwi.hunter import antibody_hunter
from mgipython.util import error_template,printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import AntibodyForm

# Routes
    
@summary.route('/antibody',methods=['GET'])
def antibodySummary():

    # gather antibodys
    form = AntibodyForm(request.args)
        
    return renderAntibodySummary(form)

@summary.route('/antibody/download',methods=['GET'])
def antibodySummaryDownload():

    # gather antibodys
    form = AntibodyForm(request.args)
    
    return renderAntibodySummaryDownload(form)


# Helpers

def renderAntibodySummary(form):
    
    antibodies = form.queryAntibodies()

    return render_template("summary/antibody/antibody_summary.html", 
                           form=form, 
                           antibodies=antibodies, 
                           queryString=form.argString())
    
    
def renderAntibodySummaryDownload(form):
    
    antibodies = form.queryAntibodies()

    # list of data rows
    antibodiesForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("Antibody MGIID")
    headerRow.append("Name")
    headerRow.append("Alias(es)")
    headerRow.append("Organism")
    headerRow.append("Type")
    headerRow.append("Class")
    headerRow.append("Notes")
    headerRow.append("Antigen ID")
    headerRow.append("Antigen Name")
    headerRow.append("Antigen Organism")
    headerRow.append("Antigen Region")
    headerRow.append("Antigen Notes")
    headerRow.append("Markers")
    headerRow.append("Reference")
    antibodiesForDownload.append(headerRow)
    
    for antibody in antibodies:
        row = []
        row.append(antibody.mgiid)
        row.append(antibody.antibodyname)
        row.append(",".join([a.alias for a in antibody.aliases]))
        row.append(antibody.organism)
        row.append(antibody.antibodytype)
        row.append(antibody.antibodyclass)
        row.append(antibody.antibodynote or '')
        if antibody.antigen:
            row.append(antibody.antigen.mgiid)
            row.append(antibody.antigen.antigenname)
            if antibody.antigen.source:
                row.append(antibody.antigen.source.organism)
            else:
                row.append("")
            row.append(antibody.antigen.regioncovered or '')
            row.append(antibody.antigen.antigennote or '')
        else:
            row.append('')
            row.append('')
            row.append('')
            row.append('')
            row.append('')
        
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
    