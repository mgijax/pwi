# Configuration for acceptance tests

# All tests assume no prefix (e.g. root url is /)
APP_PREFIX=''

DEBUG = False

# disable flask suggesting alternate URIs when you receive 404
ERROR_404_HELP = False

SQLALCHEMY_RECORD_QUERIES = False
SQLALCHEMY_ECHO = False
SQLALCHEMY_TRACK_MODIFICATIONS = True

LOG_LEVEL = "ERROR"

# create user specific log files
LOG_USERS = False

DBO_PASS = "pwidbo"

# remove password requirement for login
DEV_LOGINS = True
