from flask import render_template, redirect, request, url_for
from .blueprint import accession
from pwi.hunter import accession_hunter
from mgipython.util import error_template
from mgipython.model import Assay, Image, Marker, Reference, \
                    Allele, VocTerm, Probe, Antibody, MappingExperiment, \
                     Genotype
from pwi import app

# Constants

# map type keys to Objects
# Add new mappings here and in getURLForObject()
ACC_TYPE_MAP = {
            # reference
            1 : 'Reference',
            # marker
            2 : 'Marker',
            # probe
            3 : 'Probe',
            # mapping experiment
            4 : 'MappingExperiment',
            # antibody
            6 : 'Antibody',
            # assay
            8: 'Assay',
            # image
            9: 'Image',
            # allele
            11: 'Allele',
            # Genotype
            12: 'Genotype',
            # voc_term
            13: 'VocTerm',
            }

# Routes

@accession.route('/query', methods=['GET'])
def accessionByIDFromForm():
    ids = request.args.get('ids')
    return renderAccessionIDSearch(ids)

@accession.route('/<string:ids>')
def accessionByID(ids):
    return renderAccessionIDSearch(ids)


# Helpers

def renderAccessionIDSearch(ids):
    global ACC_TYPE_MAP
    
    accessionObj = None
    
    # Try object retrieval with mapped mgitype keys first
    accessionObjList = accession_hunter.getAccessionByAccID(ids, inMGITypeKeys=list(ACC_TYPE_MAP.keys()))
    
    # try marker symbols too
    accessionObjList.extend(accession_hunter.getAccessionByMarkerSymbol(ids))
    
    app.logger.debug("found %s accession objects: %s" \
                     % (len(accessionObjList), [r.accid for r in accessionObjList]))

    # If multiple accession objects, send to summary
    if len(accessionObjList) > 1:
        
        return render_template("summary/accession/accession_summary.html", 
          ids=ids, typemap = ACC_TYPE_MAP,
          accessionObjList=accessionObjList)

    # If single accession object, forward to detail page of object
    if len(accessionObjList) == 1:
        accessionObj = accessionObjList[0]
        objectType = ACC_TYPE_MAP[accessionObj._mgitype_key]
        newUrl = getURLForObject(accessionObj, objectType)
        return redirect(newUrl)
    
    # If we made it this far, and no accession object was found, we 
    # try again without mapped mgitype keys as a filter
    accessionObjList = accession_hunter.getAccessionByAccID(ids)
    if len(accessionObjList) > 0:
        tabletype = '%s(%s)' % (accessionObj.mgitype.name,accessionObj.mgitype.tablename)
        return error_template('Found %s object with ID = %s, '
                                   'but no link URL has been defined.' % (tabletype,id))
    
    # if still have no accession object, return default error page
    return error_template('No accession object found for ID = %s' % ids)


def getURLForObject(accessionObject, objectType):
    """
    Uses values from ACC_TYPE_MAP to determine where
    to link to with a valid accession object
    """
    url = ''
    
    # Add URL mappings here
    if objectType == 'Reference':
        # query the reference object to get mgiid for linking
        reference = Reference.query.filter_by(_refs_key=accessionObject._object_key).one()
        url = url_for('summary.referenceSummary', accids=reference.jnumid)
            
    elif objectType == 'Allele':
        # query the allele object to get mgiid for linking
        allele = Allele.query.filter_by(_allele_key=accessionObject._object_key).one()
        url = url_for('detail.alleleDetailById', id=allele.mgiid)



    elif objectType == 'Antibody':
        # query the antibody object to get mgiid for linking
        antibody = Antibody.query.filter_by(_antibody_key=accessionObject._object_key).one()
        url = url_for('detail.antibodyDetailById', id=antibody.mgiid)




    elif objectType == 'Image':
        # query the image object to get mgiid for linking
        image = Image.query.filter_by(_image_key=accessionObject._object_key).one()
        url = url_for('edit.imagedetailQF', id=image.mgiid)

    elif objectType == 'Marker':
        # query the marker object to get mgiid for linking
        marker = Marker.query.filter_by(_marker_key=accessionObject._object_key).one()
        if marker:
            
            if marker.mgiid:
                url = url_for('detail.markerDetailById', id=marker.mgiid)
            else:
                url = url_for('detail.markerDetailByKey', key=marker._marker_key)
        else:
            app.logger.warn('Failed to map accession object with key=%d to a valid marker' % accessionObject._object_key)
            url = url_for('detail.markerDetailByKey', key=accessionObject._object_key)
            
    elif objectType == 'Probe':
        # query the probe object to get mgiid for linking
        probe = Probe.query.filter_by(_probe_key=accessionObject._object_key).one()
        if probe:
            url = url_for('detail.probeDetailById', id=probe.mgiid)
        else:
            app.logger.warn('Failed to map accession object with key=%d to a valid probe' % accessionObject._object_key)
            url = url_for('detail.probeDetailByKey', key=accessionObject._object_key)
            
    elif objectType == 'MappingExperiment':
        # query the experiment object to get mgiid for linking
        experiment = MappingExperiment.query.filter_by(_expt_key=accessionObject._object_key).one()
        if experiment:
            url = url_for('detail.experimentDetailById', id=experiment.mgiid)
        else:
            app.logger.warn('Failed to map accession object with key=%d to a valid probe' % accessionObject._object_key)
            url = url_for('detail.experimentDetailByKey', key=accessionObject._object_key)
            
    elif objectType == 'VocTerm':
        # query the vocterm object to get mgiid for linking
        vocterm = VocTerm.query.filter_by(_term_key=accessionObject._object_key).one()
        
        # use EMAPA browser for EMAPA/S terms
        if vocterm.emapa_info:
                url = url_for('edit.emapaBrowser', termSearch=vocterm.primaryid);
        elif vocterm.emaps_info:
                url = url_for('edit.emapaBrowser', 
                                                termSearch=vocterm.emaps_info.emapa_term.primaryid, 
                                                stageSearch=vocterm.emaps_info._stage_key
                        )
        else:
                # all other terms go to generic term detail
                url = url_for('detail.voctermDetailById', id=vocterm.primaryid)
        
    elif objectType == 'Genotype':
        # query the Genotype object to get mgiid for linking
        genotype = Genotype.query.filter_by(_genotype_key=accessionObject._object_key).one()
        url = url_for('detail.genotypeDetailById', genotypeId=genotype.mgiid)

    elif objectType == 'Assay':
        # query the assay object to get mgiid for linking
        assay = Assay.query.filter_by(_assay_key=accessionObject._object_key).one()
        if assay:
            url = url_for('edit.assaydetailQF', id=assay.mgiid)
        else:
            app.logger.warn('Failed to map accession object with key=%d to a valid assay' % accessionObject._object_key)
            url = url_for('detail.assayDetailByKey', key=accessionObject._object_key)
            
    if not url:
        app.logger.warn('Failed to find valid URL mapping for accession object with key=%d' % accessionObject._object_key)
    
    return url
