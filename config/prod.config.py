# Production (Live) configuration settings
DEBUG = False

# disable flask suggesting alternate URIs when you receive 404
ERROR_404_HELP = False

# write logs to $LOG_DIR/app.log
WRITE_APP_LOG = True
# emails $ERROR_EMAIL on errors
EMAIL_ON_ERROR = True

LOG_LEVEL = "INFO"

# create user specific log files
LOG_USERS = True

# disable Database commits
NO_DB_COMMIT = False

# remove password requirement for login
DEV_LOGINS = False

DBO_PASS = "pwidbo"


# remeber user login for 1 day
from datetime import timedelta
REMEMBER_COOKIE_DURATION = timedelta(1)
