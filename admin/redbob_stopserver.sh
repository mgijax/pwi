#!/bin/bash

pid=`pgrep -f "python prodserver.py --port=$SERVER_PORT"`
if [ "$pid" = "" ]; then
        echo "No process found"
else
        echo "Killing process with pid=$pid\n"
        kill -9 $pid
fi
