import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class PWITestCase(unittest.TestCase):
    def test_root_url(self):
        r = tc.get('/')
        assert 'Marker Form' in r.data
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(PWITestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
