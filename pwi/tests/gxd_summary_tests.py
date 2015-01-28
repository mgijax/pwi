import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class GXDAssaySummaryTestCase(unittest.TestCase):

    # Test the gxd_summary blueprint
    def test_assay_summary_jnum_search(self):
        # query for jnum id
        r = tc.get('/summary/assay', 
                   query_string={
                         'refs_id':'J:41159'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Kit' in r.data, "check Marker Symbol"
        
    def test_assay_summary_marker_mgiid_search(self):
        # query for kit mgiid
        r = tc.get('/summary/assay', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Kit' in r.data, "check Marker Symbol"
        
    def test_assay_summary_probe_mgiid_search(self):
        # query for kit mgiid
        r = tc.get('/summary/assay', 
                   query_string={
                         'probe_id':'MGI:1203977'
                    }
        )
        
        # check associated assay mgiid
        assert 'MGI:1203979' in r.data, "check Probe Assay MGIID"
        
    def test_assay_summary_allele_mgiid_search(self):
        # query for kit allele mgiid
        r = tc.get('/summary/assay', 
                   query_string={
                         'allele_id':'MGI:1856265'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Kit' in r.data, "check Marker Symbol"
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(GXDAssaySummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
