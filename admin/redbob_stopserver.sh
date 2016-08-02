#!/bin/bash

pid=`pgrep -f "python prodserver.py --port=7001"`
printf "killing process with pid=$pid\n"
kill -9 $pid
