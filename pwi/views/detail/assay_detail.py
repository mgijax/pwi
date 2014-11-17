from flask import render_template
from blueprint import detail
from pwi.hunter import gxd_assay_hunter
from pwi.util import error_template

# Routes

@detail.route('/assay/key/<int:key>')
def assayrDetailByKey(key):
    assay = gxd_assay_hunter.getAssayByKey(key)
    if assay:
        return renderAssayDetail(assay)

    return error_template('No assay found for _assay_key = %d' % key)
    
@detail.route('/assay/<string:id>')
def assayDetailById(id):
    assay = gxd_assay_hunter.getAssayByMGIID(id)
    if assay:
        return renderAssayDetail(assay)
    
    return error_template('No assay found for ID = %s' % id)

# Helpers

def renderAssayDetail(assay):
    return render_template('detail/assay_detail.html',
                           assay = assay)