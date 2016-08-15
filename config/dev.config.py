# Development configuration
DEBUG = True

# disable flask suggesting alternate URIs when you receive 404
ERROR_404_HELP = False

SQLALCHEMY_RECORD_QUERIES = False
SQLALCHEMY_ECHO = False
SQLALCHEMY_TRACK_MODIFICATIONS = False

LOG_LEVEL = "DEBUG"

# create user specific log files
LOG_USERS = True

# remove password requirement for login
DEV_LOGINS = False

DBO_PASS = "pwidbo"
