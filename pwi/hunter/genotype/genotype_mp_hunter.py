"""
    Responsible for generating the convoluted 
    DAG relationship for the Genotype Phenotype detail
    
    Sorts MP headers as curators have selected
"""

from pwi.model.query import performQuery, batchLoadAttribute
from pwi.util import batch_list

def loadPhenotypeData(genotypes):
    """
    Loads phenotype data for every genotype in genotypes
    populates mp_headers attribute of genotype object
    """
    
    # HACK (kstone): This method uses raw sql, because the relationships are 
    # a little too convoluted for me to make sense in SQLAlchemy

    genotypeKeys = [g._genotype_key for g in genotypes]
        
    # get the mapping of header terms to annotated terms
    genotypeHeaderMap = _queryTermToHeaderMap(genotypeKeys)
    
    genotypeSortedHeaderMap = _querySortedHeaderMap(genotypeKeys)
        
    # take the header maps and populate the genotype objects with mp_headers
    batchLoadAttribute(genotypes, "mp_annots")
    _organizeTerms(genotypes, genotypeHeaderMap, genotypeSortedHeaderMap)
    
    # sort the annotations
    _sortAnnotations(genotypes)


# helpers

def _queryTermToHeaderMap(genotypeKeys):
    """
    Fetches the associations of MP header
      to annotated term for the list of genotypeKeys
      
    Returns map of genotypeKey to map of 
        annotTermKey to headerTerm list
    """
    keyMap = {}
    for batch in batch_list(genotypeKeys, 100):
        
        termToHeaderSQL = '''
            select va._object_key, va._term_key, th.term as header
            from dag_closure dc join 
                voc_annotheader vah on (vah._term_key=dc._ancestorobject_key) join
                voc_term th on (th._term_key=vah._term_key) join
                voc_annot va on (va._term_key=dc._descendentobject_key
                            and va._object_key=vah._object_key
                )
            where dc._mgitype_key=13
                and va._object_key in (%s)
        ''' % (','.join([str(k) for k in batch]))
        
        results, col_defs = performQuery(termToHeaderSQL)
        
        for r in results:
            genotypeKey = r[0]
            annotTermKey = r[1]
            headerTerm = r[2]
            
            keyMap.setdefault(genotypeKey, {})
            
            headerMap = keyMap[genotypeKey]
            headerMap.setdefault(annotTermKey, []).append(headerTerm)
    
    return keyMap

def _querySortedHeaderMap(genotypeKeys):
    """
    Fetches the headers for each genotypeKey
      
    Returns map of genotypeKey to list of sortedHeaders
    """
    keyMap = {}
    for batch in batch_list(genotypeKeys, 100):
        
        termToHeaderSQL = '''
            select vah._object_key, th.term as header, vah.sequencenum
            from voc_annotheader vah join
                voc_term th on (th._term_key=vah._term_key)
            where vah._object_key in (%s)
            order by vah._object_key, vah.sequencenum
        ''' % (','.join([str(k) for k in batch]))
        
        results, col_defs = performQuery(termToHeaderSQL)
        
        for r in results:
            genotypeKey = r[0]
            headerTerm = r[1]
            
            keyMap.setdefault(genotypeKey, []).append(headerTerm)
    
    return keyMap


def _organizeTerms(genotypes, 
                   genotypeHeaderMap, 
                   genotypeSortedHeaderMap):
    """
    populates the mp_headers attribute of genotypes
    using information from genotypeHeaderMap
    """
    
    for genotype in genotypes:
        
        if genotype._genotype_key in genotypeHeaderMap:
            
            # get the specific term -> sorted headers map for this genotype
            headerMap = genotypeHeaderMap[genotype._genotype_key]
            sortedHeaders = genotypeSortedHeaderMap[genotype._genotype_key]
            
            # init the mp_header objects (in sorted order)
            seenHeaders = {}
            for headerTerm in sortedHeaders:
                mp_header = {'term': headerTerm, 'annots': []}
                genotype.mp_headers.append(mp_header)
                seenHeaders[headerTerm] = mp_header
            
            # for each mp annotation
            for mp_annot in genotype.mp_annots:
                
                # get headers
                # if there are none, then assume current term is the header
                headers = []
                if mp_annot._term_key in headerMap:
                    headers = headerMap[mp_annot._term_key]
                else:
                    headers = [mp_annot.term]
                    
                #headers = headerMap[mp_annot._term_key]
                # for each sorted header term of this annotated term
                for headerTerm in headers:
                    
                    # Make new mp_header object if we have not seen this header
                    #   for this genotype
                    #if headerTerm not in seenHeaders:
                    #    mp_header = {'term': headerTerm, 'annots': []}
                    #    genotype.mp_headers.append(mp_header)
                    #    seenHeaders[headerTerm] = mp_header
                        
                    # append annotation to this header
                    mp_header = seenHeaders[headerTerm]
                    mp_header['annots'].append(mp_annot)
                    
    
def _sortAnnotations(genotypes):
    
    for genotype in genotypes:
        for mp_header in genotype.mp_headers:
            mp_header['annots'].sort(key=lambda a: a.term_seq)