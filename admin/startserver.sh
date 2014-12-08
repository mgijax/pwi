#!/bin/bash

DEBUG=False
export DEBUG
python runserver.py --port=$SERVER_PORT 1>/dev/null 2>/dev/null &
