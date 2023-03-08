"""
    Handle logins for the pwi
    
    Setting config value DEV_LOGINS = True
        removes password requirement for all users.
        (User must still exist in MGI_User table)
        
"""
from pwi import app
import db
from pam import pam

def unixUserLogin(userName, password):
    # authenticate using Python-PAM
    authenticated = pam().authenticate(userName, password)
    return authenticated
    
class MGIUser:
    def __init__ (self, r = None):
        self._user_key = None
        self._usertype_key = None
        self._userstatus_key = None
        self.login = None
        self.name = None
        self.orcid = None
        self._createdby_key = None
        self._modifiedby_key = None
        self.creation_date = None
        self.modification_date = None
        if r:
            self._user_key = r["_user_key"]
            self._usertype_key = r["_usertype_key"]
            self._userstatus_key = r["_userstatus_key"]
            self.login = r["login"]
            self.name = r["name"]
            self.orcid = r["orcid"]
            self._createdby_key = r["_createdby_key"]
            self._modifiedby_key = r["_modifiedby_key"]
            self.creation_date = r["creation_date"]
            self.modification_date = r["modification_date"]
                
    
    # Properties for Flask-Login functionality
    # These values are copied from mgipython (not sure how/if they're used)
    def is_authenticated(self):
        return True
    
    def is_active(self):
        return True
    
    def is_anonymous(self):
        return False
    
    def get_id(self):
        return self.login

def getMgiUser (userName) :
    cmd = "select * from mgi_user where login = '%s'" % userName
    for u in db.sql(cmd):
        return MGIUser(u)
    return None

def authenticate(userName, password):
        user = getMgiUser(userName)
        if user is None:
            return None
        if app.config['DEV_LOGINS']:
            return user
        elif userName == 'mgd_dbo' and password == app.config['DBO_PASS']:
            return user
        elif userName != 'mgd_dbo' and unixUserLogin(userName, password):
            return user
        else:
            return None
