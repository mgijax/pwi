"""
Test the gxdindex module API
"""

import sys
import os
import json
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest
from base_api_test import BaseApiTest


class GxdIndexApiTestCase(BaseApiTest):
    """
    Test gxdindex API searches
    """
    
    
    # database constants for testing
    J2_REF_KEY = 2
    J9_REF_KEY = 9
    KIT_MARKER_KEY = 10603
    PAX6_MARKER_KEY = 12184
    
    # voc terms
    KNOCK_IN_ASSAY_KEY = 74721
    NORTHERN_ASSAY_KEY = 74722
    
    STAGEID_10_KEY = 74748
    STAGEID_11_KEY = 74750
    
    
    LOW_PRIORITY_KEY = 74716
    HIGH_PRIORITY_KEY = 74714
    
    # Conditional 
    CONDITIONAL_MUTANTS_KEY = 4834240
    # Not Applicable
    NA_CONDITIONAL_MUTANTS_KEY = 4834242
     
    def setUp(self):
        self.init()
        
        # login so we can use the API
        self.login()
        
        self.add_test_index_records()
            
            
    def tearDown(self):
        self.cleanup()
            
            
    ### Helpers ###
    def add_test_index_records(self):
        """
        Insert some test data for user to search
        """
        index1 = dict(
            _refs_key=self.J2_REF_KEY,
            _marker_key=self.KIT_MARKER_KEY,
            _priority_key=self.LOW_PRIORITY_KEY,
            _conditionalmutants_key=self.NA_CONDITIONAL_MUTANTS_KEY,
            comments="Test Comment",
            indexstages=[
                dict(_stageid_key=self.STAGEID_10_KEY, 
                     _indexassay_key=self.NORTHERN_ASSAY_KEY)
            ]
        )
        self.add_test_index_record(index1)
        
        index2 = dict(
            _refs_key=self.J2_REF_KEY,
            _marker_key=self.PAX6_MARKER_KEY,
            _priority_key=self.HIGH_PRIORITY_KEY,
            _conditionalmutants_key=self.CONDITIONAL_MUTANTS_KEY,
            comments="Test Comment 2",
            indexstages=[
                dict(_stageid_key=self.STAGEID_11_KEY, 
                     _indexassay_key=self.KNOCK_IN_ASSAY_KEY)
            ]
        )
        self.add_test_index_record(index2)
        
    
    
    def add_test_index_record(self, gxdindex_record):
        """
        Insert a test gxdindex_record (dict) to the session
        """
        r = self.tc.post('/api/gxdindex',
            data=json.dumps(gxdindex_record),
            content_type = 'application/json'
        )
        
        if '_index_key'  not in r.data:
            raise Exception("Create index record failed during test setup")
            
    ### Test Searching ###
    
    def test_ref_key_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY
            )),
            content_type = 'application/json'
        )
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 2)
        
        
    def test_marker_key_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _marker_key=self.KIT_MARKER_KEY
            )),
            content_type = 'application/json'
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        
        record = results['items'][0]
        
        self.assertEqual(record['jnumid'], 'J:2')
        self.assertEqual(record['marker_symbol'], 'Kit')
        self.assertEqual(record['short_citation'], 'Bodmer WF, Heredity 1961;16():485-95')
        
    def test_priority_key_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _priority_key=self.LOW_PRIORITY_KEY
            )),
            content_type = 'application/json'
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['marker_symbol'], 'Kit')
        
        
    def test_conditional_mutants_key_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _conditionalmutants_key=self.CONDITIONAL_MUTANTS_KEY
            )),
            content_type = 'application/json'
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['marker_symbol'], 'Pax6')
        
        
    def test_comments_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                comments='test comment 2'
            )),
            content_type = 'application/json'
        )    
        
        results = json.loads(r.data)
        
        self.assertEqual(results['total_count'], 1)
        self.assertEqual(results['items'][0]['marker_symbol'], 'Pax6')
        
        
    def test_short_citation_search(self):
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                short_citation='Bodmer%'
            )),
            content_type = 'application/json'
                         
        )    
        
        results = json.loads(r.data)
        print results
        
        self.assertEqual(results['total_count'], 2)
        
        
    def test_is_coded_search(self):
        """
        NOTE: this test assumes not all indexes for Kit are fully coded
        """
        
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _marker_key=self.KIT_MARKER_KEY,
                is_coded="true"
            )),
            content_type = 'application/json'
        )    
        results = json.loads(r.data)
        
        coded_count = results['total_count']
        self.assertGreater(coded_count, 0)
        
        # now do negative query
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _marker_key=self.KIT_MARKER_KEY,
                is_coded="false"
            )),
            content_type = 'application/json'
        )    
        
        results = json.loads(r.data)
        
        not_coded_count = results['total_count']
        self.assertGreater(not_coded_count, 0)
        self.assertNotEqual(coded_count, not_coded_count)
        
        
    def test_delete_user(self):
        
        # query for a user to get its _index_key
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _marker_key=self.PAX6_MARKER_KEY
            )),
            content_type = 'application/json'
        )   
        
        results = json.loads(r.data)
        
        index2 = results['items'][0]
        
        # delete index record
        r = self.tc.delete('/api/gxdindex/%d' % index2['_index_key'])
        
        
        # query again to verify it is gone
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _marker_key=self.PAX6_MARKER_KEY
            )),
            content_type = 'application/json'
        )   
        results = json.loads(r.data)
        self.assertEquals(results['total_count'], 0)
        
        
    def test_update_user(self):
        
        # query for a user to get its _index_key
        r = self.tc.post('/api/gxdindex/search', 
            data=json.dumps(dict(
                _refs_key=self.J2_REF_KEY,
                _marker_key=self.PAX6_MARKER_KEY
            )),
            content_type = 'application/json'
        )   
        
        results = json.loads(r.data)
        
        index2 = results['items'][0]
        
        # modify the data
        index2['_refs_key'] = self.J9_REF_KEY
        index2['_marker_key'] = self.KIT_MARKER_KEY
        index2['_priority_key'] = self.LOW_PRIORITY_KEY
        index2['_conditionalmutants_key'] = self.NA_CONDITIONAL_MUTANTS_KEY
        index2['comments'] = "modify test"
        index2['indexstages'] = [
            dict(_stageid_key=self.STAGEID_10_KEY,
                 _indexassay_key=self.KNOCK_IN_ASSAY_KEY),
            dict(_stageid_key=self.STAGEID_10_KEY,
                 _indexassay_key=self.NORTHERN_ASSAY_KEY)
        ]
        
        
        # send modify request 
        r = self.tc.put('/api/gxdindex/%d' % index2['_index_key'], 
            data=json.dumps(index2),
            content_type = 'application/json'
        )  
        
        
        # query again to verify it is gone
        r = self.tc.get('/api/gxdindex/%d' % index2['_index_key'])   
        index_record = json.loads(r.data)
        
        # verify all fields reflect the new values
        self.assertEquals(index_record['_refs_key'], index2['_refs_key'])
        self.assertEquals(index_record['_marker_key'], index2['_marker_key'])
        self.assertEquals(index_record['_priority_key'], index2['_priority_key'])
        self.assertEquals(index_record['_conditionalmutants_key'], index2['_conditionalmutants_key'])
        self.assertEquals(index_record['comments'], index2['comments'])
        self.assertEquals(index_record['indexstages'], index2['indexstages'])

        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(GxdIndexApiTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
