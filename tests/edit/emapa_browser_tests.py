"""
Test the EMAPA clipboard & browser
"""

import sys
import os
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest

from pwi import app

DBO_USER = app.config['PG_USER']
DBO_PASS = app.config['PG_PASS']

tc = app.test_client()

class EMAPASearchTestCase(unittest.TestCase):
    """
    Test EMAPA term searches
    """
    
    ### Helpers ###
    
    # NOTE: no logins needed for searching
            
    ### Tests ###
            
    def test_emapa_basic_term_search(self):
        # query for single structure
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'brain'
                    }
        )    
        
        assert 'brain' in r.data, "Check term returned"
        assert '17' in r.data, "Check start stage"
        assert '28' in r.data, "Check end stage"
        
        
    def test_emapa_synonym_search(self):
        # query for single structure synonym
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'kidney'
                    }
        )    
        
        assert 'metanephros' in r.data, "Check term returned"
        
    def test_emapa_wildcard_search(self):
        # query for structure with wildcards
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'%ear%'
                    }
        )    
        
        assert 'heart' in r.data, "Check term returned"
        
    def test_emapa_id_search(self):
        # query for single emapa ID
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'EMAPA:16894'
                    }
        )    
        
        assert 'brain' in r.data, "Check term returned"
        
        
    def test_emapa_search_multiples(self):
        # query for multiple structures
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'nervous system, heart'
                    }
        )    
        
        assert 'heart' in r.data, "Check term returned"
        assert 'nervous system' in r.data, "Check term returned"
        
    
    
class EMAPAClipboardTestCase(unittest.TestCase):
    """
    Test user interaction with clipboard
    """
    
    ### Helpers ###

    def login(self, user):
        return tc.post('/login', data=dict(
            user=user,
            password='' # no password for tests
        ), follow_redirects=True)

    def logout(self):
           return tc.get('/logout', follow_redirects=True)

    ### setUp / tearDown ###

    def setUp(self):
         self.login(DBO_USER)
            
    def tearDown(self):
        # ensure that any created reports are deleted
        self.login(DBO_USER)
        
            
    ### Tests ###
            
    def test_do_clipboard_stuff(self):
        # TODO (kstone): Implement tests when we build the clipboard functionality
        pass
        
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(EMAPASearchTestCase))
    suite.addTest(unittest.makeSuite(EMAPAClipboardTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
