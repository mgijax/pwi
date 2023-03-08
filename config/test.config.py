# Configuration for acceptance tests

# All tests assume no prefix (e.g. root url is /)
APP_PREFIX=''

DEBUG = False

# disable flask suggesting alternate URIs when you receive 404
ERROR_404_HELP = False

LOG_LEVEL = "ERROR"

# create user specific log files
LOG_USERS = False

# disable Database commits
# NOTE: We don't want database commits while testing
NO_DB_COMMIT = True

DBO_PASS = "pwidbo"

# remove password requirement for login
DEV_LOGINS = True
