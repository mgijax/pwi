import test_config
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class ImagePaneSummaryTestCase(unittest.TestCase):

    # Test the probe_summart blueprint
    def test_imagepane_summary_basic_info(self):
        # query for a marker by id (kit)
        r = tc.get('/summary/imagepane', 
                   query_string={
                         'refs_id':'J:213921'
                    }
        )
        
        # check image mgiid
        assert 'MGI:5697495' in r.data, "check Image MGIID"

        # check figure label
        assert 'S4' in r.data, "check figure label"

         # check pane lebel
        assert 'E Col10a1-GFP inset' in r.data, "check pane label "

         # check assay mgiid
        assert 'MGI:5697891' in r.data, "check Assay MGIID"

         # check marker symbol
        assert 'Col10a1' in r.data, "check Marker Symbol"

         # check specimen lebel
        assert '1B Col10a1' in r.data, "check specimen label "


def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ImagePaneSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
