from flask import render_template, request
from blueprint import summary
from pwi.util import error_template
from pwi.model.core import getColumnNames
from pwi.forms import ReferenceForm
from pwi.hunter import reference_hunter

# Routes
    
@summary.route('/reference',methods=['GET'])
def referenceSummary():

    form = ReferenceForm(request.args)
    
    references = form.queryReferences()

    return render_template("summary/reference/reference_summary.html", form=form, references=references)

    