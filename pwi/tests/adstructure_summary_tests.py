import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi import app

tc = app.test_client()
class ADStructureSummaryTestCase(unittest.TestCase):

    # Test the adstructure_summary
    def test_adstructure_summary_structure_search(self):
        # query for structure text
        r = tc.get('/summary/adstructure', 
                   query_string={
                         'structure_text':'meta'
                    }
        )
        
        # check theiler stage
        assert '21' in r.data, "check Theiler Stage"
        # check structure name + highlight
        assert '<mark>meta</mark>carpus' in r.data, "check structure name and highlight"
        
    def test_adstructure_summary_exactname_search(self):
        # query for structure text
        r = tc.get('/summary/adstructure', 
                   query_string={
                         'structure_text':'epiblast'
                    }
        )
        
        # check structure name
        assert '<mark>epiblast</mark>' in r.data, "check structure name and highlight"
        
    def test_adstructure_summary_theiler_stages_search(self):
        # query for theiler stages
        r = tc.get('/summary/adstructure', 
                   query_string={
                         'theiler_stages':['10','11']
                    }
        )
        
        # check structure
        assert 'yolk sac' in r.data, "check structure name"
        


    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ADStructureSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
