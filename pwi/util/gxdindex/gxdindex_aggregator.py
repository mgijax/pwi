"""
Take list of gxdlindex records and aggregate them for displays
"""

def aggregateGenesByAssayAndStage(indexRecords):
    """
    Aggregates indexRecords by indexassay and stageid
    returns data as { 'stages': ['13.5','15.5','E',etc], 'assays':[{'indexassay':'...', stages:[count1,count2,count3,etc] }
    """
    
    stageidOrder = getUniqueStageids(indexRecords)
    assayOrder = getUniqueAssayTypes(indexRecords)
    
    # map gene counts for each indexassay and stageid combo
    countsMap = {}
    for indexRecord in indexRecords:
        for indexstage in indexRecord.indexstages:
            key = (indexstage.indexassay, indexstage.stageid)
            countsMap.setdefault(key, 0)
            countsMap[key] += 1
    
    # Order all the counts by indexassay, then stageid
    assaytypeRows = []
    for assaytype in assayOrder:
        assay = {'indexassay':assaytype, 'stages':[]}
        
        for stageid in stageidOrder:
            key = (assaytype, stageid)
            value = key in countsMap and countsMap[key] or 0
            assay['stages'].append(value)
            
        assaytypeRows.append(assay)
        
    summary = {'stages': stageidOrder, 'assays': assaytypeRows }
        
    return summary
    
    
def getUniqueStageids(indexRecords):
    """
    Return ordered list of unique stageids
    from a list of indexRecords
    """
    stageids = set([])
    for indexRecord in indexRecords:
        for indexstage in indexRecord.indexstages:
            stageids.add( (indexstage.stageid,indexstage._stageid_key) )
    stageids = list(stageids)
    
    # sort by _stageid_key
    stageids.sort(key=lambda x: x[1])
    # convert to single list of stageid strings
    stageids = [s[0] for s in stageids]
    
    return stageids

def getUniqueAssayTypes(indexRecords):
    """
    Return ordered list of unique indexassay types
    from a list of indexRecords
    """
    assaytypes = set([])
    for indexRecord in indexRecords:
        for indexstage in indexRecord.indexstages:
            assaytypes.add( (indexstage.indexassay,indexstage._indexassay_key) )
    assaytypes = list(assaytypes)
    
    # sort by _indexassay_key
    assaytypes.sort(key=lambda x: x[1])
    # convert to single list of indexassay strings
    assaytypes = [s[0] for s in assaytypes]
    
    return assaytypes


def getUniqueAssays(indexRecords):
    """
    return sorted unique list 
        of indexassays with their ordered stage values
        as [{'indexassay':'...', stages:[False,True,True,etc]
    """
     # ensure proper stage order
    stageidOrder = getUniqueStageids(indexRecords)
    
    # ensure proper assay order
    assaysOrder = getUniqueAssayTypes(indexRecords)
    
    # map stageids for each assay type
    stageidMap = {}
    for indexRecord in indexRecords:
        for indexstage in indexRecord.indexstages:
            stageidMap.setdefault(indexstage.indexassay, set([])).add(indexstage.stageid)
        
    
    # map stage values for each assay
    assays = []
    for assaytype in assaysOrder:
        assay = {'indexassay':assaytype, 'stages':[]}
        
        for stageid in stageidOrder:
            value = stageid in stageidMap[assaytype]
            assay['stages'].append(value)
            
        assays.append(assay)
    
    return assays