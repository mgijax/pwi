from flask import render_template, request
from blueprint import summary
from pwi.hunter import marker_hunter
from mgipython.util import error_template
from mgipython.model.core import getColumnNames
from pwi.forms import MarkerForm

# Constants
MARKER_LIMIT = 5000

# Routes
    
@summary.route('/marker',methods=['GET'])
def markerSummary():
    global MARKER_LIMIT
    
    # get form params
    form = MarkerForm(request.args)
    form.marker_limit.data = MARKER_LIMIT
    
    return renderMarkerSummary(form)

@summary.route('/marker/allmarker',methods=['GET'])
def markerSummaryAllMarkers():
    # get form params
    form = MarkerForm(request.args)
    
    return renderAllMarkerSummary(form)
    
# Helpers
    
def renderMarkerSummary(form):
    
    # transform into the summary format we want
    markers = form.queryMarkers()
    
    # check if results have been truncated by default limits
    markerTruncated = len(markers) >= MARKER_LIMIT
    
    return render_template("summary/marker/marker_nomen_summary.html",
                           markers=markers,
                           markerTruncated=markerTruncated,
                           form=form,
                           formArgs=form.argString(),
                           nomenSearch=form.nomen.data)
    
def renderAllMarkerSummary(form):
    markers = form.queryMarkers()
    
    return render_template("summary/marker/marker_only_summary.html",
                           markers=markers,
                           form=form,
                           nomenSearch=form.nomen.data)
