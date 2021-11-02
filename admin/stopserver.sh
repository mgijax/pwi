#!/bin/bash

if [ "${MGICONFIG}" != "" ]
then
	source ${MGICONFIG}/master.config.sh
fi

source ../Configuration

PID=`pgrep -f "prodserver.py --port=$SERVER_PORT"`
printf "Killing process with pid=$PID\n"
kill -9 $PID
