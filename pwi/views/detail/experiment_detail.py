from flask import render_template
from blueprint import detail
from pwi.hunter import experiment_hunter
from pwi.util import error_template

# Routes

@detail.route('/experiment/key/<int:key>')
def experimentDetailByKey(key):
    experiment = experiment_hunter.getExperimentByKey(key)
    if experiment:
        return renderExperimentDetail(experiment)

    return error_template('No experiment found for _experiment_key = %d' % key)
    
@detail.route('/experiment/<string:id>')
def experimentDetailById(id):
    experiment = experiment_hunter.getExperimentByMGIID(id)
    if experiment:
        return renderExperimentDetail(experiment)
    
    return error_template('No experiment found for ID = %s' % id)

# Helpers

def renderExperimentDetail(experiment):
    
    return render_template('detail/experiment_detail.html',
                           experiment = experiment
    )