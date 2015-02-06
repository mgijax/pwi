import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class AntibodyDetailTestCase(unittest.TestCase):

    # Test the antibody detail antibody info 
    def test_antibody_detail_antibody_info(self):
        # get detail
        r = tc.get('/detail/antibody/MGI:2665324')

        # check Name
        assert 'anti-Cox1 clone 1D6E1A8' in r.data, "check Name"

        # check MGI ID
        assert 'MGI:2665324' in r.data, "check MGI ID"

        # check Antibody Type
        assert 'Monoclonal' in r.data, "check Antibody Type"

        # check Organism
        assert 'mouse, laboratory' in r.data, "check Organism"

        # check Note
        assert 'The antibody is available from Molecular Probes. Species reactivity: human, bovine, rat and mouse.' in r.data, "check Note"

        # check Aliases
        assert '1D6' in r.data, "check Alias"
        assert 'A-6403' in r.data, "check Alias"
        assert '1D6-E1-A8' in r.data, "check Alias"
        assert '1D6E1A8' in r.data, "check Alias"
 
        # check Markers
        assert 'mt-Co1' in r.data, "check Markers"

        # check References
        assert 'J:73121' in r.data, "check Reference"
        assert 'J:76945' in r.data, "check Reference"
        assert 'J:79609' in r.data, "check Reference"

    # Test the antibody detail antigen info 
    def test_antibody_detail_antigen_info(self):
        # get detail
        r = tc.get('/detail/antibody/MGI:2665324')

        # check Name
        assert 'CoxI' in r.data, "check Name"
        # check MGIID
        assert 'MGI:2651444' in r.data, "check MGIID"
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AntibodyDetailTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()


