#!/bin/bash

nohup python runserver.py --port=$SERVER_PORT & 1>/dev/null 2>&1
echo $! > pwi.pid
