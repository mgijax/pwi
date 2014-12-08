#!/bin/bash

DEBUG=False
export DEBUG
python runserver.py --port=$SERVER_PORT &>/dev/null &
