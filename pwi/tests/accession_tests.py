import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class AccessionQueryTestCase(unittest.TestCase):

    #
    # DETAIL PAGE FORWARDS
    # 

    # Marker
    def test_accession_marker(self):
        # get detail for Kit
        r = tc.get('/accession/MGI:96677', 
                   follow_redirects=True)
        assert 'Kit' in r.data, "Check Marker Symbol"
        
    # Reference
    def test_accession_jnum(self):
        # get detail for reference
        r = tc.get('/accession/J:2', 
                   follow_redirects=True)
        assert 'Heredity' in r.data, "Check Journal"
        
    # Probe
    def test_accession_probe(self):
        # get detail for probe
        r = tc.get('/accession/MGI:1879167', 
                   follow_redirects=True)
        assert 'NIA clone J0541G07' in r.data, "Check Probe Name"

    # Mapping
    def test_accession_map(self):
        # get detail for mapping data
        r = tc.get('/accession/MGI:47013', 
                   follow_redirects=True)
        assert 'TEXT-Genetic Cross' in r.data, "Check Map Type"

    # Antibody
    def test_accession_antibody(self):
        # get detail for antibody
        r = tc.get('/accession/MGI:2665324', 
                   follow_redirects=True)
        assert 'anti-Cox1 clone 1D6E1A8' in r.data, "Check Antibody Name"

    # Assay
    def test_accession_assay(self):
        # get detail for assay
        r = tc.get('/accession/MGI:5582113', 
                   follow_redirects=True)
        assert 'Western blot' in r.data, "Check Assay Type"

    # Image
    def test_accession_image(self):
        # get detail for image
        r = tc.get('/accession/MGI:3587216', 
                   follow_redirects=True)
        assert 'Pictured left to right' in r.data, "Check Partial Caption"

    # Allele
    def test_accession_allele(self):
        # get detail for allele
        r = tc.get('/accession/MGI:3530308', 
                   follow_redirects=True)
        assert 'Martin Hrabe de Angelis spotted coat 1' in r.data, "Check Allele Name"

    # Genotype
    def test_accession_genotype(self):
        # get detail for genotype
        r = tc.get('/accession/MGI:2166442', 
                   follow_redirects=True)
        assert 'Otx2' in r.data, "Check Partial Allelic Combination"

    # OMIM term
    def test_accession_omim(self):
        # get detail for omim
        r = tc.get('/accession/305400', 
                   follow_redirects=True)
        assert 'Aarskog-Scott Syndrome' in r.data, "Check Term Name"

    # MP Term
    def test_accession_mp(self):
        # get detail for MP term
        r = tc.get('/accession/MP:0005369', 
                   follow_redirects=True)
        assert 'muscle phenotype' in r.data, "Check Term Name"

    # GO Term
    def test_accession_go(self):
        # get detail for GO term
        r = tc.get('/accession/GO:0009055', 
                   follow_redirects=True)
        assert 'electron carrier activity' in r.data, "Check Term Name"

    # EMAPS Term
    def test_accession_emaps(self):
        # get detail for EMAPS term
        r = tc.get('/accession/EMAPS:1610523', 
                   follow_redirects=True)
        assert 'heart' in r.data, "Check Term Name"


    #
    # FORM & SUMMARY
    # 

    def test_accession_form_submit(self):
        # use different types of IDs
        r = tc.get('/accession/query?ids=MGI:96677, MGI:1879167, MGI:47013, MGI:2665324, MGI:5582113, MGI:3587216, MGI:3530308, MGI:2166442, J:2, 305400, MP:0005369, GO:0009055, EMAPS:1610523', 
                   follow_redirects=True)
        
        # check that each ID is in summary
        assert 'MGI:96677' in r.data, "Check Marker"
        assert 'MGI:1879167' in r.data, "Check Probe"
        assert 'MGI:47013' in r.data, "Check MappingExperiment"
        assert 'MGI:2665324' in r.data, "Check Antibody"
        assert 'MGI:5582113' in r.data, "Check Assay"
        assert 'MGI:3587216' in r.data, "Check Image"
        assert 'MGI:3530308' in r.data, "Check Allele"
        assert 'MGI:2166442' in r.data, "Check Genotype"
        assert 'J:2' in r.data, "Check Reference"
        assert '305400' in r.data, "Check OMIM"
        assert 'MP:0005369' in r.data, "Check MP"
        assert 'GO:0009055' in r.data, "Check GO"
        assert 'EMAPS:1610523' in r.data, "Check EMAPS"
       
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AccessionQueryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
