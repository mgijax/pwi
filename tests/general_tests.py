import test_config

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
