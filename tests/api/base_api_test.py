"""
Base behavior for API test cases
"""
import json
import unittest

from pwi import app, db

DBO_USER = app.config['PG_USER']


class BaseApiTest(unittest.TestCase):
    
    tc = app.test_client()
    
    def init(self):
        """
        Call in the setUp function
        
        Disables Flask removing the session between requests
        """
            
        # Prevent Flask-SQLAlchemy from removing session after each request
        def do_nothing():
            pass
        self.old_db_session_remove = db.session.remove
        db.session.remove = do_nothing
            
            
    def cleanup(self):
        """
        call in the tearDown function
        
        
        Rolls back and removes session at end of each test
        """
        db.session.rollback()
        self.old_db_session_remove()
        
        
    def login(self, login=DBO_USER):
        """
        Logs into the system for edit capabilities
        """
        r = self.tc.post('/login',
            data=dict(
                user=login,
                password=''
            )
        )
        
        
        