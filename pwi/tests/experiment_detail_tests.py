import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class ExperimentDetailTestCase(unittest.TestCase):

    # Test the experiment detail blueprint
    def test_experiment_detail_basic_info(self):
        # query for a mapping experiment
        r = tc.get('/detail/experiment/MGI:39529')
        
        # check  mgiid
        assert 'MGI:39529' in r.data, "check MGI ID"
        # check reference
        assert 'J:9342' in r.data, "check experiment reference"
        # check reference note
        assert 'Revised gene symbols' in r.data, "check Reference Experiment Note"
         # check experiment type
        assert 'TEXT-Genetic Cross' in r.data, "check experiment type"
         # check chromosome
        assert '1' in r.data, "check chromosome"
         # check experiment note
        assert 'Supporting data is reported elsewhere' in r.data, "check experiment note"
        
    def test_experiment_detail_marker_table(self):
        # query for a mapping experiment
        r = tc.get('/detail/experiment/MGI:39529')
        
        # check marker symbol
        assert 'Fasl' in r.data, "check marker symbol"
        # check marker mgiid
        assert 'MGI:99255' in r.data, "check marker MGI ID"
        # check allele
        assert 'Fasl<sup>gld</sup>' in r.data, "check allele"
        # check assay type
        assert 'visible phenotype' in r.data, "check assay type"
        # check description
        assert 'lymphadenopathy' in r.data, "check description"
         # check experiment type
        assert 'TEXT-Genetic Cross' in r.data, "check experiment type"
         # check matrix data
        assert 'yes' in r.data, "check data"
        
        
    def test_experiment_detail_by_key(self):
         # query for a mapping experiment by key
        r = tc.get('/detail/experiment/key/3052')
        
        # check  mgiid
        assert 'MGI:39529' in r.data, "check MGI ID"
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ExperimentDetailTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
