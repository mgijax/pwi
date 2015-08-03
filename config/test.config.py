# Configuration for acceptance tests

# All tests assume no prefix (e.g. root url is /)
APP_PREFIX=''

DEBUG = False
SQLALCHEMY_RECORD_QUERIES = False
SQLALCHEMY_ECHO = False

LOG_LEVEL = "ERROR"

# Flag for test environment only behavior
TEST_MODE = True
