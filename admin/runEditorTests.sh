#!/bin/bash
cd ..
source Configuration

WARN_MSG="WARNING: These could potentially modify data in ${PG_SERVER}.${PG_DBNAME}" 

if [ -z $1 ]
then
	echo "Do you want to run Editor(/edit) Module acceptance tests?"
	echo "    ${WARN_MSG}"
	select yn in "yes" "no"; do
		case $yn in
			no ) exit;;
			yes ) echo "ok"; break ;;
		esac
	done
else
	echo "About to run Editor(/edit) Module tests..."
	echo "    ${WARN_MSG}"
	sleep 4
fi

APP_CONFIG_FILE=$PWI/config/test.config.py
export APP_CONFIG_FILE

cd tests/edit

echo 'Running Editor(/edit) Module acceptance tests in Postgres mode'

python all_edit_tests.py
if [ $? -ne 0 ]; then
        exit 1
fi
