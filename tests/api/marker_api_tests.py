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


class ValidMarkerSearchTestCase(BaseApiTest):
    """
    Test validation marker search
    """
     
    def setUp(self):
        self.init()
        
        # login so we can use the API
        self.login()
            
            
    def tearDown(self):
        self.cleanup()
            
            
    ### Helpers ###
    

    ### Test Searching ###
    
    def test_valid_single_marker_match(self):
        
        r = self.tc.get('/api/marker/valid', 
            query_string={
                'symbol':'kit'
            }
        )    
        
        response = json.loads(r.data)
        
        self.assertEquals(response['total_count'], 1)
        marker = response['items'][0]
        self.assertEquals(marker['symbol'], 'Kit')
        self.assertEquals(marker['_marker_key'], 10603)
        self.assertEquals(marker['name'], 'KIT proto-oncogene receptor tyrosine kinase')
        self.assertEquals(marker['chromosome'], '5')
        
        
    def test_valid_multiple_marker_match(self):
        
        r = self.tc.get('/api/marker/valid', 
            query_string={
                'symbol':'t'
            }
        )    
        
        response = json.loads(r.data)
        
        self.assertEquals(response['total_count'], 2)
        markers = response['items']
        symbols = set([m['symbol'] for m in markers])
        self.assertEquals(symbols, set(['T', 't']))
        
        
    def test_withdrawn_match(self):
        
        r = self.tc.get('/api/marker/valid', 
            query_string={
                'symbol':'dw'
            }
        )    
        
        response = json.loads(r.data)
        
        self.assertEquals(response['total_count'], 1)
        marker = response['items'][0]
        self.assertEquals(marker['symbol'], 'dw')
        self.assertEquals(marker['markerstatus'], 'withdrawn')
        

    def test_marker_not_found(self):
        
        r = self.tc.get('/api/marker/valid', 
            query_string={
                'symbol':'123456789XYZ'
            }
        )    
        
        response = json.loads(r.data)
        self.assertEquals(response['total_count'], 0)
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ValidMarkerSearchTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
