"""
    Responsible for generating the convoluted 
    DAG relationship for the Genotype Phenotype detail
    
    Sorts MP headers as curators have selected
"""

from pwi.model.query import performQuery
from pwi.util import batch_list
from pwi import app
from pwi.model import Genotype, VocTerm

import copy

# functions

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
    
    # get all the sorted header terms for each genotype (curator specified order)
    genotypeSortedHeaderMap = _querySortedHeaderMap(genotypeKeys)
    
    # get the mapping of parent to child terms for each genotype
    edgeMap = _queryGenotypeEdgeMap(genotypeKeys)
        
    # take the maps and build the ordered header objects with their annotations underneath
    _organizeTerms(genotypes, genotypeHeaderMap, genotypeSortedHeaderMap)
    
    _sortAnnotationsBySequencenum(genotypes)
    
    _collapseDuplicateAnnotations(genotypes)
    
    # sort the annotations by longest "annotated" dag path
    _sortAnnotationsByLongestPath(genotypes, edgeMap)


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
            select distinct va._object_key, va._term_key, th.term as header
            from dag_closure dc join 
                voc_annotheader vah on (vah._term_key=dc._ancestorobject_key) join
                voc_term th on (th._term_key=vah._term_key) join
                voc_annot va on (va._term_key=dc._descendentobject_key
                            and va._object_key=vah._object_key
                )
            where dc._mgitype_key=%d
                and va._object_key in (%s)
        ''' % (VocTerm._mgitype_key, ','.join([str(k) for k in batch]))
        
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

def _queryGenotypeEdgeMap(genotypeKeys):
    """
    Fetches the edges for each mp term of each genotypeKey
      
    Returns map of genotypeKey to map of parent _term_key 
        to child _term_key
    """
    keyMap = {}
    for batch in batch_list(genotypeKeys, 100):
        
        termToEdgesSQL = '''
            select child_annot._object_key genotype_key,
                dc._ancestorobject_key parent_key,
                dc._descendentobject_key child_key
            from voc_annot child_annot, 
            voc_annot parent_annot join
            dag_closure dc on (
                _mgitype_key = %d
                and _ancestorobject_key = parent_annot._term_key
            ) 
            join voc_term pt on pt._term_key=dc._ancestorobject_key
            join voc_term ct on ct._term_key=dc._descendentobject_key
            where child_annot._object_key in (%s)
                and child_annot._annottype_key = %d
                and parent_annot._object_key = child_annot._object_key
                and parent_annot._annottype_key = child_annot._annottype_key
                and dc._descendentobject_key = child_annot._term_key
        ''' % (VocTerm._mgitype_key,
               ','.join([str(k) for k in batch]),
               Genotype._mp_annottype_key)
        
        results, col_defs = performQuery(termToEdgesSQL)
        
        for r in results:
            genotypeKey = r[0]
            parentKey = r[1]
            childKey = r[2]
            
            keyMap.setdefault(genotypeKey, {})
            keyMap[genotypeKey].setdefault(parentKey, []).append(childKey)
    
    return keyMap


def _organizeTerms(genotypes, 
                   genotypeHeaderMap, 
                   genotypeSortedHeaderMap):
    """
    populates the mp_headers attribute of genotypes
    using information from genotypeHeaderMap
    
    creates mp_header objects as 
    { "term": headerTerm, "annots": [VocAnnot objects] }
    """
    
    for genotype in genotypes:
        
        headerMap = {}
        sortedHeaders = []
        
        if genotype._genotype_key in genotypeHeaderMap:
            # get the specific term -> headers map for this genotype
            headerMap = genotypeHeaderMap[genotype._genotype_key]
            
        if genotype._genotype_key in genotypeSortedHeaderMap:
            # get the sorted headers for this genotype
            sortedHeaders = genotypeSortedHeaderMap[genotype._genotype_key]
            
        
        # init the mp_header objects (in sorted order)
        seenHeaders = {}
        for headerTerm in sortedHeaders:
            mp_header = _newHeaderObject(headerTerm)
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
                
            # for each header term of this annotated term
            for headerTerm in headers:
                
                # Make new mp_header object if we have not seen this header
                #   for this genotype, however this should be regarded 
                #    as a data inconsistency
                if headerTerm not in seenHeaders:
                    
                    app.logger.warn("no entries in voc_annotheader for _object_key (genotype) = %d" 
                                    % genotype._genotype_key)
                    
                    mp_header = _newHeaderObject(headerTerm)
                    genotype.mp_headers.append(mp_header)
                    seenHeaders[headerTerm] = mp_header
                    
                # append annotation to this header
                mp_header = seenHeaders[headerTerm]
                annot_copy = copy.copy(mp_annot)
                mp_header['annots'].append(annot_copy)
                
                    
def _newHeaderObject(headerTerm):
    """
    Initialize a new dictionary/object representing this
    phenotype headerTerm
    """
    return {'term': headerTerm, 'annots': []}
    
    
def _sortAnnotationsBySequencenum(genotypes):
    """
    Sort annotations by sequencenum
    """                
    for genotype in genotypes:
        
        for mp_header in genotype.mp_headers:
            
            mp_header['annots'].sort(key=lambda a: a.term_seq)
            
                
def _collapseDuplicateAnnotations(genotypes):
    """
    Collapse the duplicate annotations in MGD
    Note: Assumes annotations are sorted so dups 
        appear in order
    """
    for genotype in genotypes:
        
        for mp_header in genotype.mp_headers:
            
            toRemove = []
            prev = None
            for i in range(len(mp_header['annots'])):
                annot = mp_header['annots'][i]
                
                if prev and prev._term_key == annot._term_key:
                    # merge the duplicate evidence records
                    for evidence in annot.evidences:
                        prev.addEvidence(evidence)
                        
                    toRemove.append(i)
                    prev.evidences.sort(key=lambda x: x._refs_key)
                    
                prev = annot
                
            # remove the duplicates
            toRemove.sort(reverse=True)
            for idx in toRemove:
                mp_header['annots'].pop(idx)
    
def _sortAnnotationsByLongestPath(genotypes, edgeMap):
    """
    Sort annotations by longest "annotated" dag path
    """
    
    for genotype in genotypes:
        
        genoEdgeMap = {}
        if genotype._genotype_key in edgeMap:
            genoEdgeMap = edgeMap[genotype._genotype_key]
            #print "genoEdgeMap[%d] = %s\n" % (genotype._genotype_key, genoEdgeMap)
            
        for mp_header in genotype.mp_headers:
            annots = mp_header['annots']
            
            # make an edge map specifically for this mp_header
            availableKeys = set([])
            for annot in annots:
                availableKeys.add(annot._term_key)
                
            headerEdgeMap = {}
            for parent, children in genoEdgeMap.items():
                if parent in availableKeys:
                    headerEdgeMap[parent] = children
                    
            #print "headerEdgeMap = %s\n" % (headerEdgeMap)
            # take edge map and reduce it to only the longest paths
            headerEdgeMap = _longestPathEdgeMap(headerEdgeMap)
            #print "longest path headerEdgeMap = %s\n" % (headerEdgeMap)
            
            annotLen = len(annots)
            i = 0
            while i < annotLen:
                annot = annots[i]
                
                #print "annot (%s), i=%d" % (annot.term, i)
                
                # get any children of this term
                if annot._term_key in headerEdgeMap:
                    childKeys = headerEdgeMap[annot._term_key]
                    toMove = []
                    for childKey in childKeys:
                        # find the child and move it up the list
                        for j in range(0, annotLen):
                            childAnnot = annots[j]
                            if childAnnot._term_key == childKey:
                                toMove.append(j)
                                
                    # for all indices we want to move (toMove)
                    # to destIdx, we have to shuffle them in the
                    # list, maintaining order, and bringing along
                    # any previously moved children            
                    
                    toMove.sort()
                    #print "toMove = %s\n" % toMove
                    popped = []
                    destIdx = i
                    
                    #print "annots = %s\n" % ([(a.term,a.calc_depth) for a in annots])
                    for idx in toMove:
                        idx -= len(popped)
                        firstPopped = annots.pop(idx)
                        localPopped = [firstPopped]
                        
                        # add any previously moved children of firstPopped
                        while idx < len(annots) and \
                             annots[idx].calc_depth > firstPopped.calc_depth:
                            localPopped.append(annots.pop(idx))
                        
                        # add them all to the popped list
                        popped.extend(localPopped)
                        
                        if idx < destIdx:
                            destIdx -= len(localPopped)
                    
                    #print "destIdx=%d, popped = %s\n" % (destIdx, [(p.term,p.calc_depth) for p in popped])
                    
                    # update calc_depth for all moved annotations        
                    for movedAnnot in popped:
                        movedAnnot.calc_depth += annot.calc_depth + 1
                    
                    # insert all the popped annotations into destIdx
                    annots[destIdx+1:destIdx+1] = popped
                    
                    #print "annots = %s\n" % ([(a.term,a.calc_depth) for a in annots])
                        
                i += 1
                
            
def _longestPathEdgeMap(edgeMap):
    """
    Take map of parentKey to childKeys
    return with duplicate paths (to childKeys)
        removed, such that only longest paths remain
    """    
    
    longMap = {}
    
    allChildKeys = set([])
    childToParents = {}
    
    for parentKey, childKeys in edgeMap.items():
        
        for childKey in childKeys:
            allChildKeys.add(childKey)
            childToParents.setdefault(childKey, set([])).add(parentKey)
            
        
    # generate all paths
    pathMap = {}
    for childKey in allChildKeys:
        
        pathMap[childKey] = []
        
        stack = [[childKey, [childKey]]]
        while stack:
            termKey, path = stack.pop()
            
            if termKey in childToParents:
                
                for parentKey in childToParents[termKey]:
                    newPath = list(path)
                    newPath.insert(0, parentKey)
                    stack.append([parentKey, newPath])
            
            # select the longest path for this childKey
            elif len(pathMap[childKey]) < len(path):
                pathMap[childKey] = path
            
    for path in pathMap.values():
        if len(path) > 1:
            
            # add path to map
            for i in range(len(path) - 1):
                
                parentKey = path[i]
                childKey = path[i + 1]
                longMap.setdefault(parentKey, set([])).add(childKey)
    
    return longMap


    
    
            
        