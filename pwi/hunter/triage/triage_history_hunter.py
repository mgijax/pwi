# Used to access data related to triage history
from mgipython.model.query import performQuery
from pwi.hunter.accession_hunter import getModelByMGIID
from datetime import datetime
from triage_meta_info import JOURNAL_URLS, PRIMARY_CURATOR_MAP, PRIMARY_CURATOR_TO_JOURNAL_MAP
from pwi import app


def searchTriageHistory(
                     journal=None,
                     selectedAreas=[],
                     primaryCurators=[],
                     selectedDate=datetime.now(),
                     order="date",
                     limit=None
                     ):
    """
    Get the triage history summary for the requested inputs
    
    order by order, either "date" or "journal"
    
    returns the results
    """
    
    whereClauses = ["bda.modification_date > '%s' " % \
        selectedDate.strftime("%Y-%m-%d")]
    
    if journal:
        journal = journal.lower()
        whereClauses.append("lower(journal) like '%s'" % journal)
    
    if primaryCurators:
        # map curators to journals
        journals = []
        for login in primaryCurators:
            if login in PRIMARY_CURATOR_TO_JOURNAL_MAP:
                journals.extend(PRIMARY_CURATOR_TO_JOURNAL_MAP[login])
                
        journals = [j.lower() for j in journals]
        journals = list(set(journals))
        
        journalsClause = "(%s)" % ' OR '.join(
                ["lower(journal) like '%s'" % j for j in journals]
        )
        whereClauses.append(journalsClause)
        
    if selectedAreas:
        whereClauses.append("abbreviation in ('%s')" % "','".join(selectedAreas))
        
    whereClause = "where %s" % ' AND '.join(whereClauses)    
    
    orderBy = "order by lastupdate desc"
    
    if order.lower() == "journal":
        orderBy = "order by journal, vol desc, issue desc"
        
    limitClause = ""
    if limit:
        limitClause = "limit %d" % limit 
    
    # TODO(kstone): Find a way to use SQLAlchemy objects to gather this data efficiently
    queryTemplate = _getTriageHistoryQueryTemplate()
    
    
    query = queryTemplate % ({'where': whereClause, 
                              'orderby': orderBy,
                              'limit': limitClause})
    
    
    results, cols = performQuery(query)
    
    results = _packageRows(results, cols)
    
    return results


def _getTriageHistoryQueryTemplate():
    """
    Get the template for inserting
    %(where)s clause
    and %(orderby)s clause
    limited by %(limit)s
    """
    query = """
    with
selections as (
    select br._refs_key, 
        br.journal, 
        coalesce(br.issue, '') issue, 
        coalesce(br.vol, '') vol, 
        br.date
    from bib_dataset_assoc bda join
    bib_dataset bd on bd._dataset_key = bda._dataset_key join
    bib_refs br on br._refs_key = bda._refs_key
    %(where)s
),
ref_used_items as (select r._refs_key, 'Probes/Seq' dataset
    from selections r where exists (select 1 from PRB_Reference r2 where r2._refs_key=r._refs_key) 
    UNION ALL
    select r._refs_key, 'Mapping' dataset
    from selections r where exists (select 1 from MLD_Expts r2 where r2._refs_key=r._refs_key) 
    UNION ALL
    select r._refs_key, 'Allele/Pheno' dataset
    from selections r where exists (select 1 from MGI_Reference_assoc r2 where _mgitype_key=11 
        and r2._refs_key=r._refs_key) 
    UNION ALL
    select r._refs_key, 'Expression' dataset
    from selections r where exists (select 1 from GXD_Index r2 where r2._refs_key=r._refs_key)
    UNION ALL
    select r._refs_key, 'Expression' dataset
    from selections r where exists (select 1 from GXD_Assay r2 where r2._refs_key=r._refs_key)
    UNION ALL
    select r._refs_key, 'GO' dataset
    from selections r where exists (select 1 from VOC_Annot a join VOC_Evidence e on e._annot_key=a._annot_key
                     where a._annottype_key = 1000 
                    and e._refs_key=r._refs_key)
    UNION ALL
    select r._refs_key, 'Nomen' dataset
    from selections r where exists (select 1 from MGI_Reference_assoc r2 where _mgitype_key = 21
        and r2._refs_key=r._refs_key)
    UNION ALL
    select r._refs_key, 'Markers' dataset
    from selections r where exists (select 1 from MGI_Reference_assoc r2 where _mgitype_key = 2 
        and r2._refs_key=r._refs_key)
    UNION ALL
    select r._refs_key, 'QTL' dataset
    from selections r where exists (select 1 from MLD_Expts r2 
                    where exptType in ('TEXT', 'TEXT-QTL', 'TEXT-QTL-Candidate Genes', 'TEXT-Congenic', 'TEXT-Meta Analysis')
                    and r2._refs_key=r._refs_key)
),
ref_used as (select journal, vol, issue, date, string_agg(distinct dataset, ', ') used
    from ref_used_items ui join
    selections r on r._refs_key = ui._refs_key
    group by journal, vol, issue, date),
ref_used_count as (select journal, vol, issue, date, count(distinct r._refs_key) usedCount
    from ref_used_items ui join
    selections r on r._refs_key = ui._refs_key
    group by journal, vol, issue, date),
ref_selected as (select journal, vol, issue, date, string_agg(distinct bd.abbreviation, ', ') selected
    from bib_dataset_assoc bda join 
    bib_dataset bd on bd._dataset_key = bda._dataset_key join
    selections r on r._refs_key=bda._refs_key
    group by journal, vol, issue, date
),
ref_selected_count as (select journal, vol, issue, date, count(distinct r._refs_key) selectCount
    from selections r
    group by journal, vol, issue, date),
ref_lastupdate as (select journal, vol, issue, date, max(bda.modification_date) lastupdate
    from bib_dataset_assoc bda join
    selections r on r._refs_key=bda._refs_key
    group by journal, vol, issue, date)
select rlu.journal,
    rlu.vol,
    rlu.issue,
    rlu.date issueDate,
    rs.selected, 
    rsc.selectCount,
    ru.used,
    ruc.usedCount,
    rlu.lastupdate date_last_sel
from ref_lastupdate rlu join
    ref_selected rs on (rs.journal = rlu.journal 
        and rs.vol = rlu.vol
        and rs.issue = rlu.issue
    and rs.date = rlu.date) join
    ref_selected_count rsc on (rsc.journal = rlu.journal 
        and rsc.vol = rlu.vol
        and rsc.issue = rlu.issue
    and rsc.date = rlu.date) left outer join
    ref_used ru on (ru.journal = rlu.journal 
        and ru.vol = rlu.vol
        and ru.issue = rlu.issue
    and ru.date = rlu.date) left outer join
    ref_used_count ruc on (ruc.journal = rlu.journal 
        and ruc.vol = rlu.vol
        and ruc.issue = rlu.issue
    and ruc.date = rlu.date)
%(orderby)s
%(limit)s
    """
    return query


                           
                           
def _packageRows(rows, cols):
    """
    Package up query rows into objects
    """
    rows = [dict((cols[i], row[i]) for i in range(len(cols))) for row in rows]
    
    # add new fields
    for row in rows:
        # map journal to primary curator
        journal = row['journal'].lower()
        
        row['primary_curator'] = ''
        row['cur_initials'] = ''
        row['access_url'] = ''
        
        if journal in PRIMARY_CURATOR_MAP:
            row['primary_curator'] = PRIMARY_CURATOR_MAP[journal]['name']
            row['cur_initials'] = PRIMARY_CURATOR_MAP[journal]['login']
            
        if journal in JOURNAL_URLS:
            row['access_url'] = JOURNAL_URLS[journal]
    
    return rows
    