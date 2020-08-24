#!/bin/csh -f

#
# Template
#


if ( ${?MGICONFIG} == 0 ) then
        setenv MGICONFIG /usr/local/mgi/live/mgiconfig
endif

source ${MGICONFIG}/master.config.csh

cd `dirname $0`

setenv LOG $0.log
rm -rf $LOG
touch $LOG
 
date | tee -a $LOG
 
cat - <<EOSQL | ${PG_DBUTILS}/bin/doisql.csh $0 | tee -a $LOG

select c.cellline,
        v1.term as cellLineType,
        p.cellLine as parentCellLine,
        v2.term as parentcellLineType,
        d.name as derivationName
from ALL_CellLine c
        INNER JOIN VOC_Term v1 on (c._CellLine_Type_key = v1._Term_key)
        LEFT OUTER JOIN ALL_CellLine_Derivation d on (c._Derivation_key = d._Derivation_key)
        LEFT OUTER JOIN ALL_CellLine p on (d._ParentCellLine_key = p._CellLine_key)
        LEFT OUTER JOIN VOC_Term v2 on (p._CellLine_Type_key = v2._Term_key)

where v1.term != v2.term

EOSQL

date |tee -a $LOG

