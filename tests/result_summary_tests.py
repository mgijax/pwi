import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class ResultSummaryTestCase(unittest.TestCase):

    # Test the result_summary by jnum
    def test_result_summary_jnum_search(self):
        # query for jnum id
        r = tc.get('/summary/result', 
                   query_string={
                         'refs_id':'J:33511'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Kit' in r.data, "check Marker Symbol"
        assert 'MGI:5478533' in r.data, "check Assay ID"
        
    #Test the result_summary by marker ID
    def test_result_summary_marker_mgiid_search(self):
        # query for kit mgiid
        r = tc.get('/summary/result', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Kit' in r.data, "check Marker Symbol"
        assert 'MGI:5478533' in r.data, "check Assay ID"
        
    def test_result_summary_direct_structure_mgiid_search(self):
        # query for branchial arch TS16 mgiid
        r = tc.get('/summary/result', 
                   query_string={
                         'direct_structure_id':'MGI:4852184'
                    }
        )
        
        # check an annotated marker symbol for Crabp1
        assert 'MGI:1344764' in r.data, "check Marker MGIID"
        


    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ResultSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
