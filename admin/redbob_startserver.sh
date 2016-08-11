#!/bin/bash

source ../Configuration

ERROR_LOG=startserver.sh.error
# Server Port here is only used to identify the running process not set the port the server is running on
nohup python prodserver.py --port=$SERVER_PORT > $ERROR_LOG 2> $ERROR_LOG < /dev/null &
