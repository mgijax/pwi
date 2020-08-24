from flask import render_template
from .blueprint import detail
from pwi.hunter import antibody_hunter
from mgipython.util import error_template

# Routes

@detail.route('/antibody/key/<int:key>')
def antibodyDetailByKey(key):
    antibody = antibody_hunter.getAntibodyByKey(key)
    if antibody:
        return renderAntibodyDetail(antibody)

    return error_template('No antibody found for _antibody_key = %d' % key)
    
@detail.route('/antibody/<string:id>')
def antibodyDetailById(id):
    antibody = antibody_hunter.getAntibodyByMGIID(id)
    if antibody:
        return renderAntibodyDetail(antibody)
    
    return error_template('No antibody found for ID = %s' % id)

# Helpers

def renderAntibodyDetail(antibody):
    
    return render_template('detail/antibody_detail.html',
                           antibody = antibody
    )
