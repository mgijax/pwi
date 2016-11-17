import test_config

import unittest
from pwi import app

tc = app.test_client()
class MarkerDetailTestCase(unittest.TestCase):

    # Test the marker_detail blueprint
    def test_marker_detail_basic_info(self):
        # get detail for Kit
        r = tc.get('/detail/marker/key/10603')
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        # check Name
        assert 'KIT proto-oncogene receptor tyrosine kinase' in r.data, "check Name"
        # check synonyms
        assert 'c-KIT' in r.data, "check Synonyms"
        # check status
        assert 'official' in r.data, "check Status"
        # check feature type
        assert 'protein coding gene' in r.data, "check Feature Type"
        # check location string
        assert 'Chr5' in r.data, "check Location"
        # check marker detail clip
        assert 'Some alleles are homozygous lethal' in r.data, "check Detail Clip Note"
        # check secondary mgi id
        assert 'MGI:3530319' in r.data, "check Secondary ID"
        
    def test_marker_detail_by_id(self):
        # get detail for Kit
        r = tc.get('/detail/marker/MGI:96677')
        
        # check Symbol
        assert 'Kit' in r.data

    def test_marker_detail_withdrawn(self):
        # get detail for a withdrawn marker
        r = tc.get('/detail/marker/key/101')
        
        # check status
        assert 'withdrawn' in r.data
        # check location string
        assert 'ChrUN' in r.data, "check Unknown Location"
        
        
    def test_marker_detail_biotypes(self):
        # get detail for Kit
        r = tc.get('/detail/marker/MGI:96677')
        
        # check biotypes
        assert 'KNOWN_protein_coding' in r.data, "check Vega biotype"
        # check biotype sequence ID
        assert 'ENSMUSG00000005672' in r.data, "check Ensembl biotype sequence ID"
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(MarkerDetailTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
