#!/bin/bash
cd ..
source Configuration

APP_CONFIG_FILE=$PWI/config/test.config.py
export APP_CONFIG_FILE

cd tests

echo 'Running acceptance tests in Postgres mode'

python all_tests.py
if [ $? -ne 0 ]; then
        exit 1
fi
