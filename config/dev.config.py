# Development configuration
DEBUG = True

# disable flask suggesting alternate URIs when you receive 404
ERROR_404_HELP = False

SQLALCHEMY_RECORD_QUERIES = True
SQLALCHEMY_ECHO = True
SQLALCHEMY_TRACK_MODIFICATIONS = False

# disable Database commits
NO_DB_COMMIT = False

LOG_LEVEL = "DEBUG"

# create user specific log files
LOG_USERS = True

# remove password requirement for login
DEV_LOGINS = True

DBO_PASS = "pwidbo"
