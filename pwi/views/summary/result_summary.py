from flask import render_template, request, Response
from blueprint import summary
from pwi import app
from pwi.hunter import result_hunter
from mgipython.util import error_template, printableTimeStamp
from mgipython.model import Result
from pwi.forms import ResultForm

### Routes ###
    
@summary.route('/result',methods=['GET'])
def resultSummary():
    
    # get form params
    form = ResultForm(request.args)
    
    return renderResultSummary(form)

@summary.route('/result/download',methods=['GET'])
def resultSummaryDownload():

    # gather references
    form = ResultForm(request.args)
    
    return renderResultSummaryDownload(form)

    
### Helpers ###
    
def renderResultSummary(form):
    
    # gather lists of results
    results = form.queryResults()
        
    return render_template("summary/result/result_summary.html",
                           results=results,
                           form=form,
                           formArgs=form.argString(),
                           queryString=form.argString())
    

def renderResultSummaryDownload(form):
    
    results = form.queryResults()

    # list of data rows
    resultsForDownload = []

    # add header
    headerRow = []
    headerRow.append("Assay ID")
    headerRow.append("Marker Symbol")
    headerRow.append("Assay Type")
    headerRow.append("Age")
    headerRow.append("Structure")
    headerRow.append("Detected")
    headerRow.append("Specimen Label")
    headerRow.append("Mutant Allele")
    resultsForDownload.append(headerRow)
    
    for result in results:
        resultRow = []
        resultRow.append(result.assay.mgiid)
        resultRow.append(result.marker.symbol)
        resultRow.append(result.assay.assaytype)
        resultRow.append(result.age)
        resultRow.append("TS" + str(result._stage_key) + ": " + result.structure.term)
        resultRow.append(str(result.expressed))
        if result.specimen:
            resultRow.append(result.specimen.specimenlabel)
        if result.genotype.combination1_cache:
            resultRow.append(result.genotype.combination1_cache.replace('\n', ' ').replace('\r', '').rstrip())
        else: 
            resultRow.append(" ")

        resultsForDownload.append(resultRow)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in resultsForDownload)
    
    filename = "result_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})