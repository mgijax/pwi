#!/bin/bash

source ../Configuration

ERROR_LOG=startserver.sh.error

nohup python prodserver.py > $ERROR_LOG 2> $ERROR_LOG < /dev/null &
