#!/bin/bash

source ../Configuration

ERROR_LOG=startserver.sh.error
rm -f $ERROR_LOG
#python prodserver.py --port=$SERVER_PORT 1>$PWI/logs/stdout.log 2>$ERROR_LOG &
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/python/lib
python prodserver.py --port=7001
