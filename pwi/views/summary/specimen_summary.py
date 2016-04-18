from flask import render_template, request, Response
from blueprint import summary
from pwi import app
from mgipython.util import error_template, printableTimeStamp
from pwi.forms import SpecimenForm

# Routes
    
@summary.route('/specimen',methods=['GET'])
def specimenSummary():
    
    # get form params
    form = SpecimenForm(request.args)
    
    return renderSpecimenSummary(form)

@summary.route('/specimen/download',methods=['GET'])
def specimenSummaryDownload():

    # get form params
    form = SpecimenForm(request.args)
    
    return renderSpecimenSummaryDownload(form)
    
    

# Helpers
    
def renderSpecimenSummary(form):
    
    # gather lists of specimens
    specimens = form.querySpecimens()

    return render_template("summary/specimen/specimen_summary.html",
                           form=form,
                           specimens=specimens,
                           formArgs=form.argString(),
                           queryString=form.argString())


def renderSpecimenSummaryDownload(form):
    
    # gather lists of specimens
    specimens = form.querySpecimens()

    # list of data rows
    specimensForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("Assay ID")
    headerRow.append("Marker Symbol")
    headerRow.append("Assay Type")
    headerRow.append("Specimen Label")
    headerRow.append("Age")
    headerRow.append("Age Note")
    headerRow.append("Sex")
    headerRow.append("Hybridization")
    headerRow.append("Fixation")
    headerRow.append("Embedding")
    headerRow.append("Background")
    headerRow.append("Allele(s)")
    headerRow.append("Specimen Note")
    specimensForDownload.append(headerRow)
    
    for specimen in specimens:
        thisRow = []
        thisRow.append(specimen.assay.mgiid)
        thisRow.append(specimen.assay.marker.symbol)
        thisRow.append(specimen.assay.assaytype)
        thisRow.append(specimen.specimenlabel or '')
        thisRow.append(specimen.age or '')
        thisRow.append(specimen.agenote or '')
        thisRow.append(specimen.sex or '')
        thisRow.append(specimen.hybridization or '')
        thisRow.append(specimen.fixation or '')
        thisRow.append(specimen.embeddingmethod or '')
        thisRow.append(specimen.genotype.geneticbackground or '')
        if specimen.genotype.combination1_cache:
            thisRow.append(specimen.genotype.combination1_cache.replace('\n', ' ').replace('\r', '').rstrip())
        else:
            thisRow.append('')
        thisRow.append(specimen.specimennote or '')
        
        specimensForDownload.append(thisRow)
    
    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in specimensForDownload)
    
    filename = "specimen_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})











