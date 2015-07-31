#!/bin/bash

PID=`pgrep -f "python prodserver.py --port=$SERVER_PORT"`
printf "Killing process with pid=$PID\n"
kill -9 $PID
