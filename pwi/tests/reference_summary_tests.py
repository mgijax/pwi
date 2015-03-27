import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app

tc = app.test_client()
class ReferenceSummaryTestCase(unittest.TestCase):

    # Test the reference_summary blueprint
    def test_reference_summary_jnum_search(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'J:2'
                    }
        )
        
        # check Author
        assert 'Bodmer WF' in r.data, "check Author"
        # check journal
        assert 'Heredity' in r.data, "check Journal"
        
    def test_reference_summary_authors_search(self):
        # query for full authors of J:64260
        r = tc.get('/summary/reference', 
                   query_string={
                         'authors':'schaible rh; gowen jw'
                    }
        )
        
        # check Jnum
        assert 'J:64260' in r.data, "check J#"
    
    def test_reference_summary_primary_author_search(self):
        # query for primary author of J:64260
        r = tc.get('/summary/reference', 
                   query_string={
                         'primeAuthor':'schaible rh'
                    }
        )
        
        # check Jnum
        assert 'J:64260' in r.data, "check J#"
    
    def test_reference_summary_year_search(self):
        # query for year of J:64260
        r = tc.get('/summary/reference', 
                   query_string={
                         'year':'1961'
                    }
        )
        
        # check Jnum
        assert 'J:64260' in r.data, "check J#"
        
    def test_reference_summary_journal_and_volume_search(self):
        # query for journal and volume of J:64260
        r = tc.get('/summary/reference', 
                   query_string={
                         'journal':'Mouse News Lett',
                         'volume':'25'
                    }
        )
        
        # check Jnum
        assert 'J:64260' in r.data, "check J#"
        
    def test_reference_summary_title_search(self):
        # query for title of J:45125
        r = tc.get('/summary/reference', 
                   query_string={
                         'title':'Selective requirement of myosin light chain 2v in embryonic heart function%',
                    }
        )
        
        # check Jnum
        assert 'J:45125' in r.data, "check J#"
        
        
    def test_reference_summary_pubmedid_search(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'1688471'
                    }
        )
        
        # check jnum
        assert 'J:10187' in r.data, "check J Num"
        
    def test_reference_summary_multipleids(self):
        # query for gene symbol
        r = tc.get('/summary/reference', 
                   query_string={
                         'accids':'J:2,1688471'
                    }
        )
        
        # check jnum
        assert 'J:10187' in r.data, "check J Num for 1688471"
         # check journal for J:2 since there is no pub med id
        assert 'Heredity' in r.data, "check Journal for J:2"
        
    def test_reference_summary_marker_id(self):
        # query for gene ID
        r = tc.get('/summary/reference', 
                   query_string={
                         'marker_id':'MGI:87853'
                    }
        )
        
        # check jnum
        assert 'J:105' in r.data, "check J Num"
        # check non-direct associated reference
        assert 'J:148663' in r.data, "check non-direct reference J Num"
        
    def test_reference_summary_allele_id(self):
        # query for allele ID
        r = tc.get('/summary/reference', 
                   query_string={
                         'allele_id':'MGI:1856842'
                    }
        )
        
        # check jnum
        assert 'J:64260' in r.data, "check J Num"
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ReferenceSummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
