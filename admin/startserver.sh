#!/bin/bash

#
# if using MGICONFIG...
#
if [ "${MGICONFIG}" != "" ]
then
	source ${MGICONFIG}/master.config.sh
fi

source ../Configuration

if [ "$1" == "-c" ] ; then
    python prodserver.py --port=$SERVER_PORT
else
    nohup python prodserver.py --port=$SERVER_PORT  &
fi

sleep 1
