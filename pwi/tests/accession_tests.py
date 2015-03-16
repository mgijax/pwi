import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class AccessionQueryTestCase(unittest.TestCase):

    # Test the accession blueprint
    def test_accession_rest_url(self):
        # get detail for Kit
        r = tc.get('/accession/MGI:96677', 
                   follow_redirects=True)
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        
    def test_accession_jnum(self):
        # get detail for Kit
        r = tc.get('/accession/J:2', 
                   follow_redirects=True)
        
        # check Journal
        assert 'Heredity' in r.data, "check Journal"
        
    # temp removal of non-MGI IDs
    #def test_accession_non_mgi_id(self):
    #    # use Affy ID for Kit
    #    r = tc.get('/accession/1415900_a_at', 
    #               follow_redirects=True)
    #    
    #    # check Symbol
    #    assert 'Kit' in r.data, "check Symbol"
        
    def test_accession_form_submit(self):
        # use MGI ID for Kit
        r = tc.get('/accession/query?ids=MGI:96677', 
                   follow_redirects=True)
        
        # check Symbol
        assert 'Kit' in r.data, "check Symbol"
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AccessionQueryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
