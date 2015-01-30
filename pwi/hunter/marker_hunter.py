# Used to access marker related data
from pwi.model import Accession, Marker, Synonym, Reference, VocTerm
from pwi import db
from pwi.model.query import batchLoadAttribute, batchLoadAttributeExists, performQuery
from accession_hunter import getModelByMGIID

def getMarkerByKey(key):
    marker = Marker.query.filter_by(_marker_key=key).first()
    _prepMarker(marker)
    return marker

def getMarkerByMGIID(id):
    id = id.upper()
    #marker = Marker.query.filter_by(mgiid=id).first()
    marker = getModelByMGIID(Marker, id)
    _prepMarker(marker)
    return marker

def _prepMarker(marker):
    """
    Load any attributes a detail page might need
    """
    if marker:
        # add the has_explicit_references existence attribute
        batchLoadAttributeExists([marker], ['all_references', 
                                        'expression_assays',
                                        'alleles', 
                                        'probes', 
                                        'antibodypreps'])

def searchMarkers(nomen=None, 
                  refs_id=None, 
                  featuretypes=None, 
                  limit=None):
    """
    Perform search for Marker records by various parameters
    e.g. nomen, _refs_key
    
    ordered by Marker.symbol
    """
    
    query = Marker.query.filter_by(_organism_key=1)
    
    if nomen:
        nomen = nomen.lower()
        # query Marker symbol, name, synonyms
        query = query.filter(
                db.or_(db.func.lower(Marker.symbol).like(nomen),
                       db.func.lower(Marker.name).like(nomen),
                       Marker.synonyms.any(db.func.lower(Synonym.synonym).like(nomen))
                       )
        ) 
            
    if refs_id:
        reference_accession = db.aliased(Accession)
        sub_marker = db.aliased(Marker)
        sq = db.session.query(sub_marker) \
                .join(sub_marker.all_references) \
                .join(reference_accession, Reference.jnumid_object) \
                .filter(reference_accession.accid==refs_id) \
                .filter(sub_marker._marker_key==Marker._marker_key) \
                .correlate(Marker)
                
        query = query.filter(
                sq.exists()     
        )
        
    if featuretypes:
        
        ft_vocterm = db.aliased(VocTerm)
        sub_marker = db.aliased(Marker)
        sq = db.session.query(sub_marker) \
                .join(ft_vocterm, sub_marker.featuretype_vocterms) \
                .filter(
                    db.or_(
                       ft_vocterm.term.in_(featuretypes),
                       ft_vocterm.ancestor_vocterms.any(VocTerm.term.in_(featuretypes))
                    )
                ) \
                .filter(sub_marker._marker_key==Marker._marker_key) \
                .correlate(Marker)
                
        query = query.filter(
                sq.exists()
        )
            
    query = query.order_by(Marker.markerstatus, Marker.symbol)
    
    if limit:
        query = query.limit(limit)
        
    markers = query.all()
    
    # batch load some related data needed on summary page
    batchLoadAttribute(markers, 'synonyms')
    batchLoadAttribute(markers, 'secondary_mgiids')
    batchLoadAttribute(markers, 'featuretype_vocterms')
    
    return markers


    