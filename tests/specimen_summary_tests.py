import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class SpecimenSummaryTestCase(unittest.TestCase):

    # Test the probe_summart blueprint
    def test_specimen_summary_basic_info(self):
        # query for a marker by id (kit)
        r = tc.get('/summary/specimen', 
                   query_string={
                         'jnum':'J:213921'
                    }
        )
        
        # check assay mgiid
        assert 'MGI:5697891' in r.data, "check Assay MGIID"

        # check marker symbol
        assert 'Col10a1' in r.data, "check Marker Symbol"

         # check assay type
        assert 'RNA in situ' in r.data, "check Assay Type "

         # check specimen label
        assert '1B Col10a1' in r.data, "check Specimen Label"

         # check age
        assert 'embryonic day 15.0' in r.data, "check Age"

         # check background
        assert '129S1/Sv' in r.data, "check Background"

         # check alleles
        assert 'tm4Ksec' in r.data, "check Alleles"


def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(SpecimenSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
