#!/bin/bash

if [ "${MGICONFIG}" != "" ]
then
        source ${MGICONFIG}/master.config.sh
fi

source ../Configuration

python devserver.py
