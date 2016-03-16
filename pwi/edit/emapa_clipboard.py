"""
pwi logic for editting EMAPA clipboard

"""

from exceptions import SyntaxError, ValueError
from mgipython.model.edit.EMAPA import clipboard
from pwi.hunter import vocterm_hunter
from pwi import app, db

from pwi.error.errors import InvalidStageInputError, InvalidEMAPAIDError
from pwi.parse import emapaStageParser, splitCommaInput


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
    stages = emapaStageParser(stagesToAdd)
    
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
