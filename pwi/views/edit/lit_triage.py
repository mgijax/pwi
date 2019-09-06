from flask import render_template
from blueprint import edit

@edit.route('/triage/', methods=['GET'])
def litTriageQF():
    return render_template( "edit/triage/lit_triage.html")

@edit.route('/triageFull/', methods=['GET'])
def litTriageFullQF():
    return render_template( "edit/triage/lit_triage_full.html")

@edit.route('/triageShort/', methods=['GET'])
def litTriageShortQF():
    return render_template( "edit/triage/lit_triage_short.html")
