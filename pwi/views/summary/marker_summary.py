from flask import render_template, request
from blueprint import summary
from pwi.hunter import marker_hunter, nomen_hunter
from pwi.util import error_template
from pwi.model.core import getColumnNames
from pwi.model import NOM_Marker
from pwi.util import createSummaryList

# Constants
NOMEN_LIMIT = 25
MARKER_LIMIT = 100

# Routes
    
@summary.route('/marker',methods=['GET'])
def markerSummary():
    # get form params
    nomen = request.args.get('nomen', default='')
    
    # reconstruct request string
    # TODO(kstone): make this easy in a generic way
    formArgs = "nomen=%s" % (nomen)
     
    nomens = getNomenRecords(nomen)
    
    markers = []
    
    return renderMarkerSummary(nomens, markers, formArgs)

@summary.route('/marker/allnomen',methods=['GET'])
def markerSummaryAllNomen():
    # get form params
    nomen = request.args.get('nomen', default='')
    
    nomens = getNomenRecords(nomen, nolimit=True)
    
    
    return renderNomenSummary(nomens)
    
# Helpers

def getNomenRecords(nomen, nolimit=False):
    global NOMEN_LIMIT
    # restrict which nomen records to query
    nomen_statuses = ['Reserved', 
                     'In Progress', 
                     'Deleted', 
                     'Approved']
    limit = NOMEN_LIMIT
    if nolimit:
        limit = None
    return nomen_hunter.searchNOM_MarkerByNomen(nomen,
                        nomen_statuses=nomen_statuses, 
                        limit=limit)
    
def createNomenSummaryResults(nomens):
    nomenColumns = ['symbol', 
               'nomenstatus',
               'mgiid',
               'name', 
               'synonyms']
    nomens = createSummaryList(nomens, nomenColumns)
    return nomens, nomenColumns

def createMarkerSummaryResults(markers):
    markerColumns = ['symbol',
                     'mgiid'
                     'name',
                     'synonyms',
                     'featuretype',
                     'markerstatus']
    markers = createSummaryList(markers, markerColumns)
    
    return markers, markerColumns

def renderMarkerSummary(nomens, markers, formArgs=''):
    global NOMEN_LIMIT, MARKER_LIMIT
    
    # transform into the summary format we want
    nomens, nomenColumns = createNomenSummaryResults(nomens)
    markers, markerColumns = createMarkerSummaryResults(markers)
    
    # check if results have been truncated by default limits
    nomenTruncated = len(nomens) == NOMEN_LIMIT
    markerTruncated = len(markers) == MARKER_LIMIT
    
    return render_template("summary/marker_summary.html",
                           nomens=nomens,
                           nomenColumns=nomenColumns,
                           nomenTruncated=nomenTruncated,
                           markers=markers,
                           markerColumns=markerColumns,
                           markerTruncated=markerTruncated,
                           formArgs=formArgs)
    
def renderNomenSummary(nomens):
    nomens, nomenColumns = createNomenSummaryResults(nomens)
    
    return render_template("summary/marker_nomen_summary.html",
                    nomens=nomens,
                    nomenColumns=nomenColumns)