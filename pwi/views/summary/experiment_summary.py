from flask import render_template, request, Response
from .blueprint import summary
from pwi.hunter import experiment_hunter
from mgipython.util import error_template,printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import ExperimentForm

# Constants
EXPERIMENT_LIMIT = 5000

# Routes
    
@summary.route('/experiment',methods=['GET'])
def experimentSummary():

    global EXPERIMENT_LIMIT

    # gather experiments
    form = ExperimentForm(request.args)
    if 'experiment_limit' not in request.args:
        form.experiment_limit.data = EXPERIMENT_LIMIT
        
    return renderExperimentSummary(form)

@summary.route('/experiment/download',methods=['GET'])
def experimentSummaryDownload():

    # gather experiments
    form = ExperimentForm(request.args)
    
    return renderExperimentSummaryDownload(form)


# Helpers

def renderExperimentSummary(form):
    
    experiments = form.queryExperiments()
    
    experimentsTruncated = form.experiment_limit.data and \
            (len(experiments) >= EXPERIMENT_LIMIT)

    return render_template("summary/experiment/experiment_summary.html", 
                           form=form, 
                           experiments=experiments, 
                           experimentsTruncated=experimentsTruncated,
                           queryString=form.argString())
    
    
def renderExperimentSummaryDownload(form):
    
    experiments = form.queryExperiments()

    # list of data rows
    experimentsForDownload = []
    
    # add header
    headerRow = []
    headerRow.append("Experiment Type")
    headerRow.append("Chromosome")
    headerRow.append("Reference J Num")
    headerRow.append("Reference Citation")
    experimentsForDownload.append(headerRow)
    
    for experiment in experiments:
        row = []
        row.append(experiment.expttype)
        row.append(experiment.chromosome)
        row.append(experiment.reference.jnumid)
        row.append(experiment.reference.short_citation)
        experimentsForDownload.append(row)

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join(row)) for row in experimentsForDownload)
    
    filename = "experiment_summary_%s.txt" % printableTimeStamp()

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})
    