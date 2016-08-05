#!/bin/bash

# Server Port here is only used to identify the running process not set the port the server is running on
pid=`pgrep -f "python prodserver.py --port=$SERVER_PORT"`
if [ "$pid" = "" ]; then
        echo "No process found"
else
        echo "Killing process with pid=$pid\n"
        kill -9 $pid
fi
