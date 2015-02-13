from flask import render_template, request
from blueprint import summary
from pwi import app
from pwi.hunter import result_hunter
from pwi.util import error_template
from pwi.model import Result
from pwi.forms import ResultForm

# Routes
    
@summary.route('/result',methods=['GET'])
def resultSummary():
    
    # get form params
    form = ResultForm(request.args)
    
    return renderResultSummary(form)
    
# Helpers
    
def renderResultSummary(form):
    
    # gather lists of results
    results = form.queryResults()
        
    return render_template("summary/result/result_summary.html",
                           results=results,
                           form=form,
                           formArgs=form.argString())
    