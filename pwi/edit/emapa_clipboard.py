"""
pwi logic for editting EMAPA clipboard

"""

from exceptions import SyntaxError, ValueError
from mgipython.model.edit.EMAPA import clipboard
from pwi.hunter import vocterm_hunter

class InvalidStageInputError(SyntaxError):
    """
    Raised on invalid theiler stage input
    """

class InvalidEMAPAIDError(SyntaxError):
    """
    Raised on invalid EMAPA ID input
    """


def addItems(_user_key, emapaId, stagesToAdd):
    """
    Parse stagesToAdd into list of stages
    
    throws InvalidStageInputError on invalid input
    
    Adds clipboard record for every emapaId, stage combo
    """
    
    # find vocterm record
    emapaTerm = vocterm_hunter.getVocTermByPrimaryID(emapaId)
    
    if not emapaTerm:
        raise InvalidEMAPAIDError("Cannot find term for EMAPA ID: %s" % emapaId)
    
    
    # parse stage input
    stages = stageParser(stagesToAdd)
    
    addedItems = False
    
    for stage in stages:
        
        # only add stages valid for this term
        if stage >= emapaTerm.emapa_info.startstage \
            and stage <= emapaTerm.emapa_info.endstage:
            
            clipboard.insertItem(_user_key, emapaTerm._term_key, stage)
            addedItems = True
            
        else:
            if "*" not in stagesToAdd and "all" not in stagesToAdd.lower():
                raise InvalidStageInputError("%s is invalid for range %d-%d for %s(%s)" % \
                        (stage, 
                         emapaTerm.emapa_info.startstage,
                         emapaTerm.emapa_info.endstage,
                         emapaTerm.term,
                         emapaId)
                )
    
    
    if addedItems:
        # adding a duplicate can cause sequencenums to have gaps
        #    so we normalize them here
        #    This is necessary, because EI requires sequencenums without gaps
        clipboard.normalizeSequencenums(_user_key)
    
    

def deleteItems(_user_key, keysToDelete):
    """
    Deletes all _setmember_keys in keysToDelete,
        for the given _user_key
    """
    
    _setmember_keys = splitCommaInput(keysToDelete)
    
    deletedItems = False
    
    for _setmember_key in _setmember_keys:
        
        clipboard.deleteItem(_setmember_key, _user_key=_user_key)
        deletedItems = True

    if deletedItems:
        # deleting items can cause sequencenums to have gaps
        #    so we normalize them here
        #    This is necessary, because EI requires sequencenums without gaps
        clipboard.normalizeSequencenums(_user_key)


def sortClipboard(_user_key):
    """
    Sorts user's EMAPA clipboard for the given _user_key
    """
    
    clipboard.sortClipboardSequencenums(_user_key)

    
# helper functions

def stageParser(input):
    """
    parse input into list of theiler stages
    
    Valid inputs are:
        1) single stage "1" or "10"
        2) list "1,2,3" or "10, 11, 20"
        3) range "1-20"
        4) all stages "*"
    """
    stages = []
    
    if input:
        
        input = input.lower()
        
        # check for wildcard
        if "*" in input \
            or "all" in input:
            
            return range(1, 29)
        
        # split on comma, then parse each token
        commaSplit = input.split(",")
        
        tokens = []
        
        for token in commaSplit:
            
            token = token.strip()
            if token:
                
                # resolve range input
                if "-" in token:
                    dashSplit = token.split("-")
                    
                    # cannot have more than two operands
                    if len(dashSplit) != 2:
                        msg = "invalid range input: %s" % (token)
                        raise InvalidStageInputError(msg)
                    
                    left = dashSplit[0].strip()
                    right = dashSplit[1].strip()
                    
                    # left and right must not be whitespace
                    if not left and right:
                        msg = "invalid range input: %s" % (token)
                        raise InvalidStageInputError(msg)
                    
                    # left and right must be integers
                    try:
                        leftStage = int(left)
                        rightStage = int(right)
                    except ValueError, ve:
                        raise InvalidStageInputError(ve.message)
                    
                    # left must not be greater than right
                    if leftStage > rightStage:
                        msg = "invalid range input %d > %d: %s" % (leftStage, rightStage, token)
                        raise InvalidStageInputError(msg)
                    
                    # IFF range input is valid, we add the range of values
                    for stage in range(leftStage, rightStage + 1):
                        tokens.append(stage)
               
                else:
                    tokens.append(token)
        
        
        seen = set([])
        for stage in tokens:
        
            try:
                stage = int(stage)
            except ValueError, ve:
                raise InvalidStageInputError(ve.message)
            
            # only add distinct list of stages
            if stage in seen:
                continue
            seen.add(stage)
            
            stages.append(stage)
    
    return stages


def splitCommaInput(param):
    """
    split input on comma
    returns lists of inputs
    """
    tokens = []
    splitTokens = param.split(',')
    for token in splitTokens:
        tokens.append(token.strip())
    return tokens
