# Configuration for acceptance tests

# All tests assume no prefix (e.g. root url is /)
APP_PREFIX=''

DEBUG = False
SQLALCHEMY_RECORD_QUERIES = False
SQLALCHEMY_ECHO = False
SQLALCHEMY_TRACK_MODIFICATIONS = False

LOG_LEVEL = "ERROR"

# create user specific log files
LOG_USERS = False

# remove password requirement for login
DEV_LOGINS = True
