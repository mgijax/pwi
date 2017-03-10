import test_config

import unittest
from pwi import app

tc = app.test_client()
class AlleleSummaryTestCase(unittest.TestCase):

    # Test the allele_summary blueprint
    def test_allele_summary_marker_id_search(self):
        # query for kit alleles
        r = tc.get('/summary/allele', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        # check mgi id
        assert 'MGI:3576614' in r.data, "check allele MGI ID"
        # check name
        assert 'delta 18' in r.data, "check name"
        # check synonyms
        assert 'deltaexon18' in r.data, "check synonyms"
        # check allele status
        assert 'Approved' in r.data, "check allele status"
        # check type
        assert 'Chemically induced' in r.data, "check allele type"
        # check subtype
        assert 'Conditional ready' in r.data, "check allele subtype"
        # check mp
        assert 'has data' in r.data, "check mp column"
        # check disease
        assert 'gastrointestinal' in r.data, "check disease column"
        
    def test_allele_summary_refs_id_search(self):
        # query for kit<d18> allele reference
        r = tc.get('/summary/allele', 
                   query_string={
                         'refs_id':'J:97533'
                    }
        )
        # check mgi id
        assert 'MGI:3576614' in r.data, "check allele MGI ID"
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AlleleSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
