import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class ProbeDetailTestCase(unittest.TestCase):

    # Test the probe_detail blueprint
    def test_probe_detail_basic_info(self):
        r = tc.get('/detail/probe/MGI:892467')
        
        # check probe name
        assert 'mbr0' in r.data, "check Probe Name"
        # check probe MGI ID
        assert 'MGI:892467' in r.data, "check Probe MGI ID"
         # check segment type
        assert 'cDNA' in r.data, "check Segment Type"
        # check Library
        assert 'Stratagene' in r.data, "check Library"
        # check Library reference
        assert 'J:38615' in r.data, "check Library reference"
        
        #check species
        assert 'mouse, laboratory' in r.data, "check for species of origin"
        # check age
        assert 'postnatal newborn' in r.data, "check age"
        # check tissue
        assert 'brain' in r.data, "check tissue"
        # check region covered
        assert '5\' and middle portion' in r.data, "check region covered"
        # check vector
        assert 'Plasmid' in r.data, "check vector"
        # check insert size
        assert '652kb' in r.data, "check insert size"
        # check notes
        assert 'produces alternate transcripts' in r.data, "check probe notes"
        
    def test_probe_detail_primer_info(self):
        r = tc.get('/detail/probe/MGI:1')
        
        # check type
        assert 'primer' in r.data, "check segment type"
        # check sequence 1
        assert 'CATCG' in r.data, "check primer sequence 1"
        # check sequence 2
        assert 'AGATTC' in r.data, "check primer sequence 2"
        
    def test_probe_detail_derivedfrom(self):
        r = tc.get('/detail/probe/MGI:8641')
        
        # check derivedfrom
        assert 'phage 15' in r.data, "check derivedfrom probe"
        
    def test_probe_detail_by_key(self):
        r = tc.get('/detail/probe/key/394316')
        
        # check probe mgiid
        assert 'MGI:892467' in r.data, "check Probe MGIID"
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ProbeSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
