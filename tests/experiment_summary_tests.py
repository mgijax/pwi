import test_config

import unittest
from pwi import app

tc = app.test_client()
class ExperimentSummaryTestCase(unittest.TestCase):

    # Test the experiment summary blueprint
    def test_experiment_summary_basic_info(self):
        # query for a marker with mapping experiment data by id (kit)
        r = tc.get('/summary/experiment', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check  experiment type
        assert 'TEXT-Physical Mapping' in r.data, "check experiment type"
        # check chromsome
        assert '5' in r.data, "check experiment chromosome"
         # check jnum
        assert 'J:11255' in r.data, "check Reference J Num"
         # check citation
        assert 'Smith EA, Proc Natl' in r.data, "check Reference Citation"
        
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ExperimentSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
