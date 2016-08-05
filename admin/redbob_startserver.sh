#!/bin/bash

source ../Configuration

ERROR_LOG=startserver.sh.error
rm -f $ERROR_LOG
#python prodserver.py --port=$SERVER_PORT 1>$PWI/logs/stdout.log 2>$ERROR_LOG &
nohup python prodserver.py &

