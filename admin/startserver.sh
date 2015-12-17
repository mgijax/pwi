#!/bin/bash

ERROR_LOG=startserver.sh.error
rm -f $ERROR_LOG
python prodserver.py --port=$SERVER_PORT 1>/dev/null 2>$ERROR_LOG &

sleep 1

if [[ -s $ERROR_LOG ]] ; then
	cat $ERROR_LOG
fi ;

echo "stderr log = $ERROR_LOG"
