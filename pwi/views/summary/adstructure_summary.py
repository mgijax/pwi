from flask import render_template, request, Response
from blueprint import summary
from pwi import app
from pwi.hunter import result_hunter
from mgipython.util import error_template, printableTimeStamp
from mgipython.model import ADStructure
from pwi.forms import ADStructureForm

### Routes ###
    
@summary.route('/adstructure',methods=['GET'])
def adstructureSummary():
    
    # get form params
    form = ADStructureForm(request.args)
    
    return renderADStructureSummary(form)

    
### Helpers ###
    
def renderADStructureSummary(form):
    
    # gather lists of structures
    structures = form.queryStructures()
        
    return render_template("summary/adstructure/adstructure_summary.html",
                           structures=structures,
                           form=form,
                           formArgs=form.argString(),
                           queryString=form.argString(),
                           structureSearch=form.structure_text.data)
    