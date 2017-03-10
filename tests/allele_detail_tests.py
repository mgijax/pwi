import test_config

import unittest
from pwi import app

tc = app.test_client()
class AlleleDetailTestCase(unittest.TestCase):

    # Test the marker_detail blueprint
    def test_allele_detail_basic_info(self):
        # TODO (kstone): Please add allele detail tests if you can
        assert True
  
class AllelePhenotypesByGenotypeTestCase(unittest.TestCase):

    # Test the marker_detail blueprint
    def test_allele_phenotypes_basic(self):
        # pick an old allele with normal and abnormal annotations
        # This is Cd44<tm1.1Ugu> (MGI:2679706)
        r = tc.get('/detail/allele/genotype/sub/25459')
        
        # test genotype IDs
        assert 'MGI:2679730' in r.data, "test genotype ID"
        # test background strain
        assert 'involves: 129/Sv * C57BL/6' in r.data, "test genetic background"
        # test abnormal annotation
        assert 'abnormal T-helper 2 physiology' in r.data, "test abnormal annotation"
        # test normal annotation
        assert '(normal)' in r.data, "test normal annotation"
        # test note
        assert '78% as opposed to 44%' in r.data, "test notes"
        # test jnumid
        assert 'J:62867' in r.data, "test reference jnum ID"
        
    def test_allele_phenotypes_sorted_headers(self):
        # pick an old allele with phenotypes
        # This is Cd44<tm1.1Ugu> (MGI:2679706)
        r = tc.get('/detail/allele/genotype/sub/25459')
        
        # test headers are correctly sorted
        genotypePos = r.data.find('MGI:2679730')
        
        header1Pos = r.data.find('digestive/alimentary phenotype', genotypePos)
        header2Pos = r.data.find('immune system phenotype', genotypePos)
        header3Pos = r.data.find('hematopoietic system phenotype', genotypePos)
        
        assert header1Pos < header2Pos and header2Pos < header3Pos, \
            "Testing correct header order for genotype MGI:2679730"
            
    def test_allele_phenotypes_disease_section(self):
        # pick an old allele with disease (both null and NOT qualifier)
        # This is Abcc8<tm1Jbry> (MGI:2386677)
        r = tc.get('/detail/allele/genotype/sub/8452')
        
        # test disease term
        assert 'transient neonatal diabetes mellitus' in r.data, "test disease term"
        # test disease DO ID
        assert 'DOID:0060334' in r.data, "test DO ID"
        # test jnumid
        assert 'J:61356' in r.data, "test reference jnum ID"
        # test NOT annotation
        assert '(NOT)' in r.data, "test NOT annotation"
        
    def test_allele_phenotypes_sex_annotation(self):
        # pick an allele with a sex specificity property that is not NA
        # This is Mafb<kr> (MGI:1856419)
        r = tc.get('/detail/allele/genotype/sub/563')
        
        # test sex annotation
        assert 'Sex' in r.data, "test sex specificity property"
        
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AlleleDetailTestCase))
    suite.addTest(unittest.makeSuite(AllelePhenotypesByGenotypeTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
