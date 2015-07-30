import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class PWITestCase(unittest.TestCase):
    def test_root_url(self):
        r = tc.get('/')
        assert 'Marker Form' in r.data
        assert 'Reference Form' in r.data
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(PWITestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
