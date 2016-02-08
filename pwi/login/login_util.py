"""
    Handle logins for the pwi
    
    Setting config value DEV_LOGINS = True
        removes password requirement for all users.
        (User must still exist in MGI_User table)
        
"""
from flask import session
from pwi import app
from mgipython.model.login import unixUserLogin # for unix authentication
from mgipython.model import MGIUser
import logging
import os


class UserLoggingFilter(logging.Filter):
    """
    Create a filter to only log the current user 
        to its handler
    """
    
    def __init__(self, user):
        self.user = user
    
    def filter(self, record):
        if 'user' in session and session['user'] == self.user:
            return True
        return False


FILE_HANDLER_CACHE = {}

def _createUserLogger(user):
    """
    Create a special logger for this user that will
        log all actions when logged in.
    """
    global FILE_HANDLER_CACHE
    
    # do not create user logger if LOG_USERS is disabled
    if not app.config['LOG_USERS']:
        return
    
    # We want to see everything, so set it to DEBUG
    logLevel = logging.DEBUG
    logFileName = "%s.log" % user
    
     # make a file logger that rotates every day
    from logging.handlers import TimedRotatingFileHandler
    file_handler = TimedRotatingFileHandler(os.path.join(app.config['LOG_DIR'], logFileName),
                                when='D',
                                interval=1,
                                backupCount=14)
    file_handler.setLevel(logLevel)
    formatter = logging.Formatter('%(asctime)s %(levelname)s] - %(message)s')
    file_handler.setFormatter(formatter)
    
    # add filter that only applies to this user
    file_handler.addFilter(UserLoggingFilter(user))
    
    # add handler to global app logger
    app.logger.addHandler(file_handler)
    
    # track all user handlers for later removal/cleanup
    FILE_HANDLER_CACHE[user] = file_handler
    
    
    
def _removeUserLogger(user):
    """
    Unregister the special user logger
    """
    
    if "log_handler" in session and session["log_handler"]:
        app.logger.removeHandler(session["log_handler"])
        FILE_HANDLER_CACHE[user] = None
    


def mgilogin(user, password):
    """
    Login functionality for users
    
    returns MGIUser object (if successful)
    """

    #get user and log them in
    userObject = None
    if app.config['DEV_LOGINS']:
        # For unit tests we don't want to authenticate with Unix passwords
        userObject = MGIUser.query.filter_by(login=user).first()
    else:
        userObject = unixUserLogin(user, password)
    
    if userObject:
        app.logger.debug("User Login - %s" % user)
        _createUserLogger(user)
        
    return userObject



def mgilogout(user):
    """
    Perform any cleanup necessary for logging out
    """
    app.logger.debug("User Logout - %s" % user)
    _removeUserLogger(user)
    
    
def refreshLogin(user):
    
    # Initialize user if app is restarted
    user = session['user']
    if user and \
        (user not in FILE_HANDLER_CACHE or not FILE_HANDLER_CACHE[user]):
        _createUserLogger(user)
        
