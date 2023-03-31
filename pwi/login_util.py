"""
    Handle logins for the pwi
    
    Setting config value DEV_LOGINS = True
        removes password requirement for all users.
        (User must still exist in MGI_User table)
        
"""
import db
from pam import pam
from pwi import app, APP_PREFIX
from flask import Flask, request, session, redirect, url_for, render_template 
from flask_login import LoginManager, current_user, login_user, logout_user
from flask_json import as_json

# create the login manager
login_manager = LoginManager()
login_manager.init_app(app)

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

@login_manager.user_loader
def getMgiUser (userName) :
    cmd = "select * from mgi_user where login = '%s'" % userName
    for u in db.sql(cmd):
        db.commit()
        return MGIUser(u)
    return None

# set current user if there is one
@app.before_request
def before_request():
    
    if current_user and current_user.is_authenticated:
        session['user'] = current_user.login
        session['authenticated'] = True
    
    if 'user' not in session:
        session['user'] = ''
    if 'authenticated' not in session:
        session['authenticated'] = False
        
def authenticateUnixUser(userName, password):
    # authenticate using Python-PAM
    authenticated = pam().authenticate(userName, password)
    return authenticated
    
def authenticate(userName, password, config):
        user = getMgiUser(userName)
        if user is None:
            return None
        if config['DEV_LOGINS']:
            return user
        elif userName == 'mgd_dbo' and password == config['DBO_PASS']:
            return user
        elif userName != 'mgd_dbo' and authenticateUnixUser(userName, password):
            return user
        else:
            return None

@app.route(APP_PREFIX+'/login',methods=['GET','POST'])
def login():
    error=""
    user=""
    next=""
    if request.method=='POST':
            form = request.form
            user = 'user' in form and form['user'] or ''    
            password = 'password' in form and form['password'] or ''
            next = 'next' in form and form['next'] or ''
            
            #get user and log them the heck in
            userObject = authenticate(user, password, app.config)
                
            if userObject:
                    # successful login
                    session['user']=user
                    session['password']=password
                    session['authenticated'] = True
                    # Tell Flask about it. 
                    login_user(userObject, remember=True)
            
                    return redirect(next or url_for('index'))
                
            error = "user or password is invalid"

    return render_template('authenticate.html', error=error, user=user, next=next)
    

@app.route(APP_PREFIX+'/logout')
def logout():
        session['user']=None
        session['password']=None
        session['authenticated'] = False
        
        logout_user()
        next = request.args.get('next')
        
        return redirect(next or url_for('index'))

@app.route(APP_PREFIX+'/loggedin')
@as_json
def loggedin () :
    return current_user
    
