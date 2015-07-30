from flask import render_template, request, Response
from blueprint import triage
from pwi.hunter import probe_hunter
from mgipython.util import error_template,printableTimeStamp
from mgipython.model.core import getColumnNames
from pwi.forms import TriageHistoryForm
from datetime import datetime
from pwi import app

# Constants
ROW_LIMIT = 5000

# Routes
    
@triage.route('/history',methods=['GET'])
def historySummary():

    global ROW_LIMIT

    # gather probes
    form = TriageHistoryForm(request.args)
    if 'history_limit' not in request.args:
        form.history_limit.data = ROW_LIMIT
    if 'selectedDate' not in request.args:
    	# default to one month ago
    	year = datetime.today().year
    	month = datetime.today().month-1
    	if month == 0: 
      		month = 12
      		year = year -1
    	form.selectedDate.data = datetime(year, month, 1)
        
    return renderHistorySummary(form)


# Helpers

def renderHistorySummary(form):
    
    rows = form.queryHistory()
    
    truncated = form.history_limit.data and \
            (len(rows) >= ROW_LIMIT)

    return render_template("triage/history_summary.html", 
                           form=form, 
                           rows=rows, 
                           truncated=truncated,
                           queryString=form.argString())

    