from flask import render_template, request
from blueprint import summary
from pwi.util import error_template
from pwi.model.core import getColumnNames
#from pwi.forms import MarkerForm
#from pwi.hunter import marker_hunter, nomen_hunter

# Routes
    
@summary.route('/reference',methods=['GET'])
def referenceSummary():
    
    return render_template("summary/reference/reference_summary.html",)

    