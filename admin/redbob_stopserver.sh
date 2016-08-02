#!/bin/bash

pid=`pgrep -f "python prodserver.py --port=7001"`
if [ "$pid" = "" ]; then
	echo "No process found"
else
	echo "Killing process with pid=$pid\n"
	kill -9 $pid
fi
