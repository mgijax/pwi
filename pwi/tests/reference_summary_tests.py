import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class ReferenceSummaryTestCase(unittest.TestCase):

    # Test the reference_summary blueprint
    def test_reference_summary_jnum_search(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'J:2'
                    }
        )
        
        # check Author
        assert 'Bodmer WF' in r.data, "check Author"
        # check journal
        assert 'Heredity' in r.data, "check Journal"
        
    def test_reference_summary_pubmedid_search(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'1688471'
                    }
        )
        
        # check jnum
        assert 'J:10187' in r.data, "check J Num"
        
    def test_reference_summary_multipleids(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'J:2,1688471'
                    }
        )
        
        # check jnum
        assert 'J:10187' in r.data, "check J Num for 1688471"
         # check journal for J:2 since there is no pub med id
        assert 'Heredity' in r.data, "check Journal for J:2"
        
    def test_reference_summary_marker_id(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'marker_id':'MGI:87853'
                    }
        )
        
        # check jnum
        assert 'J:105' in r.data, "check J Num"
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ReferenceSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
