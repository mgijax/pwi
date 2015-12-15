import test_config

import unittest
from pwi import app

tc = app.test_client()
class SequenceSummaryTestCase(unittest.TestCase):

    # Test the sequence summary blueprint
    def test_sequence_summary_basic_info(self):
        # query for sequences data by marker_id (Ktrap15)
        r = tc.get('/summary/sequence', 
                   query_string={
                         'marker_id':'MGI:1347350'
                    }
        )
        
        # check  sequence ID 
        assert 'AK132534' in r.data, "check sequence ID"
        # check type
        assert 'RNA' in r.data, "check sequence type"
        # check length
        assert '850' in r.data, "check sequence length"
        # check strain
        assert 'C57BL/6J' in r.data, "check sequence strain"
        # check description
        assert 'Mus musculus 10 days' in r.data, "check sequence description"
        # check multiple marker symbols
        assert 'Krtap14' in r.data, "check marker symbol"
        assert 'Krtap15' in r.data, "check marker symbol"
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(SequenceSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
