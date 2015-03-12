# Used to access marker related data
from pwi.model import ADStructure, ADStructureName
from pwi import db
from accession_hunter import getModelByMGIID

def getStructureByKey(key):
    return ADStructure.query.filter_by(_structure_key=key).first()

def getStructureByPrimaryID(id):
    id = id.upper()
    return getModelByMGIID(ADStructure, id)
    
    
def searchStructures(structure_text=None,
                     theiler_stages=None,
                     limit=None):
    
    # structures to be returned
    structures = []

    query = ADStructure.query
            
    if structure_text:
        
        # perform contains search
        structure_text = structure_text.lower()
        query = query.filter(
            ADStructure.synonyms.any(
                db.func.lower(ADStructureName.structure).like("%%%s%%" % structure_text)
            )
        )
        
    if theiler_stages:
        theiler_stages = [int(s) for s in theiler_stages]
        query = query.filter(ADStructure._stage_key.in_(theiler_stages))

                    
    # specific sort requested by GXD
    query = query.order_by(ADStructure._stage_key, ADStructure.printname)

    structures = query.all()

    return structures
