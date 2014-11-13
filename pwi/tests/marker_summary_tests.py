import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class MarkerSummaryTestCase(unittest.TestCase):

    # Test the marker_summary blueprint
    def test_marker_summary_basic_nomen_symbol_search(self):
        # query for gene symbol
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'kit'
                    }
        )
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        # check feature type
        assert 'protein coding gene' in r.data, "check Feature Type"
        
    def test_marker_summary_basic_nomen_synonym_search(self):
        # query for gene name
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'kit oncogene'
                    }
        )
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        
    def test_marker_summary_basic_nomen_synonym_search(self):
        # query for synonym of Gnai2
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'Gia'
                    }
        )
        
        # check Symbol
        assert 'Gnai2' in r.data, "check Symbol"
        
    def test_marker_summary_basic_nomen_wilcard_search(self):
        # query for 'kit oncogene' with wild cards inserted
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'%it onc%ne'
                    }
        )
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        
    def test_marker_summary_withdrawn_marker(self):
        # query for withdrawn marker symbol
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'gia'
                    }
        )
        
        # check Symbol
        assert 'Gia' in r.data, "check Symbol"
        # check status
        assert 'withdrawn' in r.data, "check Marker Status"
        
    def test_marker_summary_nomen_matches(self):
        # query for reserved nomenclature symbol
        r = tc.get('/summary/marker', 
                   query_string={
                         'nomen':'Uglt'
                    }
        )
        
        # check Symbol
        assert 'Uglt' in r.data, "check Nomen Symbol"
        # check nomen status
        assert 'Reserved' in r.data, "check Nomen Status"
        
    def test_marker_summary_jnumid(self):
        # query for reserved nomenclature symbol
        r = tc.get('/summary/marker', 
                   query_string={
                         'refs_id':'J:105'
                    }
        )
        
        # check mgiid
        assert 'MGI:87853' in r.data, "check MGI ID"
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(MarkerSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
