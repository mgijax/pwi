"""
Test the user module API
"""

import sys
import os
import json
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest
from base_api_test import BaseApiTest


class UserApiTestCase(BaseApiTest):
    """
    Test User API searches
    """
    
    # database constants for testing
    ACTIVE_STATUS_KEY = 316350
    INACTIVE_STATUS_KEY = 316351
    
    CURATOR_TYPE_KEY = 316352
    DBO_TYPE_KEY = 316354
     
    def setUp(self):
        self.init()
        
        # login so we can use the API
        self.login()
        
        self.add_test_users()
            
            
    def tearDown(self):
        self.cleanup()
            
            
    ### Helpers ###
    def add_test_users(self):
        """
        Insert some test data for user to search
        """
        user1 = dict(
            login='xyz_testuser1',
            name='XYZ Curator User 1',
            _userstatus_key=self.ACTIVE_STATUS_KEY,
            _usertype_key=self.CURATOR_TYPE_KEY
        )
        self.add_test_user(user1)
        
        user2 = dict(
            login='xyz_testuser2',
            name='XYZ Inactive Curator User 2',
            _userstatus_key=self.INACTIVE_STATUS_KEY,
            _usertype_key=self.CURATOR_TYPE_KEY
        )
        self.add_test_user(user2)
        
        user3 = dict(
            login='xyz_testuser3',
            name='XYZ DBO User 3',
            _userstatus_key=self.ACTIVE_STATUS_KEY,
            _usertype_key=self.DBO_TYPE_KEY
        )
        self.add_test_user(user3)
    
    
    def add_test_user(self, user):
        """
        Insert a test user (dict) to the session
        """
        r = self.tc.post('/api/user/',
            data=json.dumps(user),
            content_type = 'application/json'
        )
            
    ### Test Searching ###
    
    def test_login_wildcard_search(self):
        
        r = self.tc.get('/api/user/', 
            query_string={
                'login':'xyz_testuser%'
            }
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 3)
        
        
    def test_name_search(self):
        
        r = self.tc.get('/api/user/', 
            query_string={
                'name':'XYZ Curator User 1'
            }
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['login'], 'xyz_testuser1')
        
        
    def test_status_search(self):
        
        r = self.tc.get('/api/user/', 
            query_string={
                'login': 'xyz_testuser%',
                '_userstatus_key':self.INACTIVE_STATUS_KEY
            }
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['login'], 'xyz_testuser2')
        
        
    def test_type_search(self):
        
        r = self.tc.get('/api/user/', 
            query_string={
                'login': 'xyz_testuser%',
                '_usertype_key':self.DBO_TYPE_KEY
            }
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['login'], 'xyz_testuser3')
        
        
    
    def test_delete_user(self):
        
        # query for a user to get its _user_key
        r = self.tc.get('/api/user/', 
            query_string={
                'login': 'xyz_testuser3'
            }
        )   
        
        results = json.loads(r.data)
        
        user3 = results['items'][0]
        
        # delete user
        r = self.tc.delete('/api/user/%d' % user3['_user_key'])
        
        
        # query again to verify it is gone
        r = self.tc.get('/api/user/', 
            query_string={
                'login': 'xyz_testuser3'
            }
        )   
        results = json.loads(r.data)
        self.assertEquals(results['total_count'], 0)
        
        
        
    def test_modify_user(self):
        
        # query for a user to get its _user_key
        r = self.tc.get('/api/user/', 
            query_string={
                'login': 'xyz_testuser3'
            }
        )   
        
        results = json.loads(r.data)
        
        user3 = results['items'][0]
        
        # modify stuff
        user3['login'] = 'xyz_testuser3_1'
        user3['name'] = 'Testing'
        user3['_userstatus_key'] = self.INACTIVE_STATUS_KEY
        user3['_usertype_key'] = self.CURATOR_TYPE_KEY
        
        # update
        r = self.tc.put('/api/user/%d' % user3['_user_key'], 
            data=json.dumps(user3),
            content_type = 'application/json'
        )   
        updated_user = json.loads(r.data)
        self.assertEquals(updated_user['login'], 'xyz_testuser3_1')
        self.assertEquals(updated_user['name'], 'Testing')
        self.assertEquals(updated_user['_userstatus_key'], self.INACTIVE_STATUS_KEY)
        self.assertEquals(updated_user['_usertype_key'], self.CURATOR_TYPE_KEY)
        

        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(UserApiTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
