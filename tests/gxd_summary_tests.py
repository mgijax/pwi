import test_config

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
        # query for probe
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

    def test_assay_summary_antibody_mgiid_search(self):
        # query for antibody mgiid
        r = tc.get('/summary/assay', 
                   query_string={
                         'antibody_id':'MGI:2179584'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Cdkn1b' in r.data, "check for Marker Symbol"
        
class GXDIndexSummaryTestCase(unittest.TestCase):

    # Test the gxd index summary blueprint
    def test_gxdindex_summary_jnum_search(self):
        # query for jnum id
        r = tc.get('/summary/gxdindex', 
                   query_string={
                         'refs_id':'J:174063'
                    }
        )
        
        # check an annotated marker symbol
        assert 'Sod2' in r.data, "check Marker Symbol"
        # check assay type
        assert 'Prot-sxn' in r.data, "check assay type"
        # check stage
        assert '9.5' in r.data, "check assay stage"
        # check fully coded
        assert '(Fully Coded)' in r.data, "check fully coded"
        
        
    # Test the index by age / assay_type summary
    def test_gxdindex_summary_age_assay_type(self):
        # query for jnum id
        r = tc.get('/summary/gxdindex', 
                   query_string={
                         'refs_id':'J:176660',
                         'age':'17',
                         'assay_type':'Prot-sxn'
                         
                    }
        )
        
        # check an annotated marker symbol
        assert 'Acta2' in r.data, "check Marker Symbol"
        # check assay type
        assert 'Prot-sxn' in r.data, "check assay type"
        # check stage
        assert '17' in r.data, "check assay stage"
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(GXDAssaySummaryTestCase))
    suite.addTest(unittest.makeSuite(GXDIndexSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
