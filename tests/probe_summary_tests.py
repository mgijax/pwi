import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

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
        
    def test_probe_summary_by_refs_id(self):
        # query for a reference with probes
        r = tc.get('/summary/probe', 
                   query_string={
                         'refs_id':'J:23149'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:36058' in r.data, "check Probe MGIID"
        
    def test_probe_summary_by_probe_name(self):
        r = tc.get('/summary/probe', 
                   query_string={
                         'probe_name':'Kit cDNA-3'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:10666' in r.data, "check Probe MGIID"
        
    def test_probe_summary_by_probe_alias(self):
        r = tc.get('/summary/probe', 
                   query_string={
                         'probe_name':'Probe D'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:10666' in r.data, "check Probe MGIID"
        
    def test_probe_summary_by_segmenttype(self):
        # limit set by probe_name also
        r = tc.get('/summary/probe', 
                   query_string={
                         'segmenttypes':['cDNA','genomic'],
                         'probe_name':'%kit%'
                    }
        )
        
        # check probe mgiid
        assert 'MGI:10666' in r.data, "check Probe MGIID"
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ProbeSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
