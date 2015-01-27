import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class ProbeSummaryTestCase(unittest.TestCase):

    # Test the probe_summart blueprint
    def test_probe_summary_basic_info(self):
        # query for a marker by id (kit)
        r = tc.get('/summary/probe', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:36058' in r.data, "check Probe MGIID"
        # check probe name
        assert 'B11.S6.RF.C6' in r.data, "check Probe Name"
         # check segment type
        assert 'genomic' in r.data, "check Segment Type"
         # check marker symbol
        assert 'Kit' in r.data, "check Marker Symobl"
        #check putatives
        assert 'PUTATIVE' in r.data, "check for PUTATIVE"
         # check chromosome
        assert '5' in r.data, "check chromosome"
        
    def test_probe_summary_by_marker_id(self):
        # query for a marker with probes (kit)
        r = tc.get('/summary/probe', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:36058' in r.data, "check Probe MGIID"
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ProbeSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
