"""
Test the reference module API
"""

import sys
import os
import json
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest
from base_api_test import BaseApiTest


class ValidReferenceSearchTestCase(BaseApiTest):
    """
    Test valid reference search
    """
     
    def setUp(self):
        self.init()
        
        # login so we can use the API
        self.login()
            
            
    def tearDown(self):
        self.cleanup()
            
            
    ### Helpers ###
    

    ### Test Searching ###
    
    def test_valid_reference_retrieval(self):
        
        r = self.tc.get('/api/reference/valid', 
            query_string={
                'jnumber':'2'
            }
        )    
        
        reference = json.loads(r.data)
        
        self.assertEquals(reference['_refs_key'], 2)
        self.assertEquals(reference['jnumid'], 'J:2')
        self.assertEquals(reference['short_citation'], 'Bodmer WF, Heredity 1961;16():485-95')
        
        
    def test_reference_not_found(self):
        
        r = self.tc.get('/api/reference/valid', 
            query_string={
                'jnumber':'9999999901'
            }
        )    
        
        response = json.loads(r.data)
        self.assertEquals(response['status_code'], 404)
        self.assertEquals(response['error'], 'NotFoundError')
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ValidReferenceSearchTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
