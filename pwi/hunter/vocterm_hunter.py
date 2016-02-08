# Used to access marker related data
from mgipython.model import VocTerm, Accession, Vocab, Synonym
from mgipython.modelconfig import db
from accession_hunter import getModelByMGIID

def getVocTermByKey(key):
    return VocTerm.query.filter_by(_term_key=key).first()

def getVocTermByPrimaryID(id):
    id = id.upper()
    #return VocTerm.query.filter_by(primaryid=id).first()
    accAlias = db.aliased(Accession)
    return VocTerm.query.join(accAlias, VocTerm.primaryid_object) \
            .filter(accAlias.accid==id).first()
    
    
def searchEMAPATerms(termSearch="",
                     limit=None):
    
    
    emapaVocabName = "EMAPA"
    
    query = VocTerm.query
    
    # Filter only EMAPA terms
    vocab_alias = db.aliased(Vocab)
    query = query.join(vocab_alias, VocTerm.vocab).filter(vocab_alias.name==emapaVocabName)
    
    
    if termSearch:
        
        # do something
        
        termSearch = termSearch.lower()
        termsToSearch = splitCommaInput(termSearch)
        
        # query IDs, terms, and synonyms then UNION all
        
        # search accession ID
        accession_alias = db.aliased(Accession)
        sub_term1 = db.aliased(VocTerm)
        
        id_sq = db.session.query(sub_term1) \
                .join(accession_alias, sub_term1.all_accession_ids) \
                .filter(db.func.lower(accession_alias.accid).in_(termsToSearch)) \
                .filter(sub_term1._term_key==VocTerm._term_key) \
                .correlate(VocTerm)
        
        # search terms
        sub_term2 = db.aliased(VocTerm)
        term_sq = db.session.query(sub_term2) \
                .filter(db.or_(
                               db.func.lower(VocTerm.term).like(term) for term in termsToSearch \
                        )) \
                .filter(sub_term2._term_key==VocTerm._term_key) \
                .correlate(VocTerm)
        
        # search synonyms
        synonym_alias = db.aliased(Synonym)
        sub_term3 = db.aliased(VocTerm)
                
        synonym_sq = db.session.query(sub_term3) \
                .join(synonym_alias, sub_term3.synonyms) \
                .filter(db.or_(
                               db.func.lower(synonym_alias.synonym).like(term) for term in termsToSearch \
                        )) \
                .filter(sub_term3._term_key==VocTerm._term_key) \
                .correlate(VocTerm)
        
        # perform union
        query1 = query.filter(id_sq.exists())
        query2 = query.filter(term_sq.exists())
        query3 = query.filter(synonym_sq.exists())
        query = query1.union(query2).union(query3)
        #query = query2
        
    
    # setting sort
    query = query.order_by(VocTerm.term.asc())
        
    # setting limit on number of returned references
    if limit:
        query = query.limit(limit) 
                   
    terms = query.all()
    
    return terms




def splitCommaInput(input):
    """
    split input on comma
    returns lists of inputs
    """
    inputs = []
    tokens = input.split(',')
    for token in tokens:
        inputs.append(token.strip())
    return inputs

