#!/bin/bash

#
# if using MGICONFIG...
#
if [ "${MGICONFIG}" != "" ]
then
	source ${MGICONFIG}/master.config.sh
fi

source ../Configuration

ERROR_LOG=startserver.sh.error
rm -f $ERROR_LOG
#python prodserver.py --port=$SERVER_PORT 1>$PWI/logs/stdout.log 2>$ERROR_LOG &
nohup python prodserver.py --port=$SERVER_PORT  &

sleep 1

if [[ -s $ERROR_LOG ]] ; then
        cat $ERROR_LOG
fi ;

echo "stderr log = $ERROR_LOG"

