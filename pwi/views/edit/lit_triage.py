from flask import render_template
from blueprint import edit

@edit.route('/triage/', methods=['GET'])
def litTriage():
    return render_template( "edit/triage/lit_triage.html")
