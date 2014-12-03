import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class AssayDetailTestCase(unittest.TestCase):

    # Test the assay_Detail blueprint
    def test_assay_detail_basic_info(self):
        # get detail for blot assay
        r = tc.get('/detail/assay/key/1001')
        
        # check mgi id of assay
        assert 'MGI:1203979' in r.data, "check Assay ID"
        # check j#
        assert 'J:46439' in r.data, "check J#"
        # check Assayed Gene
        assert 'Zfp36' in r.data, "check Assayed Gene"
        # check Probe
        assert 'st95_8' in r.data, "check Probe"
        # check Assay note
        assert 'MgCl2: 3.5 mM;' in r.data, "check Assay Note"
        
    def test_assay_detail_by_id(self):
        # get detail for blot assay
        r = tc.get('/detail/assay/MGI:1203979')
        
        # check Symbol
        assert 'Zfp36' in r.data
        
            
    def test_assay_detail_with_antibody(self):
        # get detail for assay with antibody
        r = tc.get('/detail/assay/key/1709')
        
        # check antibody
        assert 'anti-uvomorulin' in r.data, "check antibody"
        
    def test_assay_detail_gelinfo(self):
        # get detail for blot assay
        r = tc.get('/detail/assay/key/1001')
        
        # check control
        assert 'Control: no data stored' in r.data, "check Control note"
        # check Lane#
        assert 'Lane 1' in r.data, "check Lane #"
        # check Age
        assert 'postnatal week 6-8' in r.data, "check Age"
        # check Structure
        assert 'TS28: brain' in r.data, "check structure"
        # check gelrow
        assert '254.0 bp' in r.data, "check GelRow"
        # check band
        assert 'Trace' in r.data, "check band strength"
        # check amount
        assert '0.05' in r.data, "check amount"
        # check rnatype
        assert 'total' in r.data, "check RNA Type"
        # check genetic background
        assert 'C57BL/6J' in r.data, "check genetic background"
        # check sex
        assert 'Pooled' in r.data, "check sex"
        
    def test_assay_detail_specimeninfo(self):
        # get detail for insitu assay
        r = tc.get('/detail/assay/key/11742')
        
        # check reporter gene
        assert 'lacZ' in r.data, "check Reporter Gene"
        # check imagepane label
        assert '4H' in r.data, "check ImagePane label"
        # check genetic background
        assert 'involves: C57BL/6 * CBA' in r.data, "check Genetic Background"
        # check Structure
        assert 'tail paraxial mesenchyme' in r.data, "check structure"
        # check age
        assert 'embryonic day 11.5' in r.data, "check age"
        # check hybridization
        assert 'whole mount' in r.data, "check hybridization"
        # check strength
        assert 'present' in r.data, "check strength"
        # check pattern
        assert 'Regionally restricted' in r.data, "check Pattern"
        # check result note
        assert 'present in the rostral cauda' in r.data, "check result note"
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AssayDetailTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
