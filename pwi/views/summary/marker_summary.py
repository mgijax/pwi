from flask import render_template, request
from blueprint import summary
from pwi.hunter import marker_hunter, nomen_hunter
from pwi.util import error_template
from pwi.model.core import getColumnNames
from pwi.model import NOM_Marker
from pwi.forms import MarkerForm

# Constants
NOMEN_LIMIT = 5000
MARKER_LIMIT = 5000

# Routes
    
@summary.route('/marker',methods=['GET'])
def markerSummary():
    global NOMEN_LIMIT, MARKER_LIMIT
    
    # get form params
    form = MarkerForm(request.args)
    form.nomen_limit.data = NOMEN_LIMIT
    form.marker_limit.data = MARKER_LIMIT
    
    return renderMarkerSummary(form)

@summary.route('/marker/allnomen',methods=['GET'])
def markerSummaryAllNomen():
    # get form params
    form = MarkerForm(request.args)
    
    return renderNomenSummary(form)

@summary.route('/marker/allmarker',methods=['GET'])
def markerSummaryAllMarkers():
    # get form params
    form = MarkerForm(request.args)
    
    return renderAllMarkerSummary(form)
    
# Helpers
    
def renderMarkerSummary(form):
    
    # transform into the summary format we want
    nomens = form.queryNomen()
    markers = form.queryMarkers()
    
    # check if results have been truncated by default limits
    nomenTruncated = len(nomens) >= NOMEN_LIMIT
    markerTruncated = len(markers) >= MARKER_LIMIT
    
    return render_template("summary/marker/marker_nomen_summary.html",
                           nomens=nomens,
                           nomenTruncated=nomenTruncated,
                           markers=markers,
                           markerTruncated=markerTruncated,
                           form=form,
                           formArgs=form.argString(),
                           nomenSearch=form.nomen.data)
    
def renderNomenSummary(form):
    nomens = form.queryNomen()
    
    return render_template("summary/marker/nomen_only_summary.html",
                    nomens=nomens,
                    form=form,
                    nomenSearch=form.nomen.data)
    
def renderAllMarkerSummary(form):
    markers = form.queryMarkers()
    
    return render_template("summary/marker/marker_only_summary.html",
                           markers=markers,
                           form=form,
                           nomenSearch=form.nomen.data)