import test_config

import unittest
from pwi import app

tc = app.test_client()
class AntibodySummaryTestCase(unittest.TestCase):

    # Test the antibody_summary blueprint
    def test_antibody_summary_basic_info(self):
        # query for a marker by id (kit)
        r = tc.get('/summary/antibody', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check antibody mgiid
        assert 'MGI:5576712' in r.data, "check Antibody MGIID"
        # check antibody name
        assert 'anti c-kit' in r.data, "check Antibody Name"
         # check type
        assert 'Polyclonal' in r.data, "check Antibody Type"
        # check antibody organism
        assert 'rabbit' in r.data, "check Antibody organism"
        # check antiboy note
        assert 'The antibody was obtained from Dako' in r.data, "check Antibody note"
         # check marker symbol
        assert 'Kit' in r.data, "check Marker Symobl"
         # check Reference Jnum
        assert 'J:148991' in r.data, "check Reference J Number"
        
        
        # check antigen fields
        
        assert 'MGI:5295247' in r.data, "check antigen ID"
        assert 'human' in r.data, "check antigen organism"
        
        
        
    def test_antibody_summary_by_marker_id(self):
        # query for a marker with antibodies (kit)
        r = tc.get('/summary/antibody', 
                   query_string={
                         'marker_id':'MGI:96677'
                    }
        )
        
        # check antibody mgiid
        assert 'MGI:5295248' in r.data, "check Antibody MGIID"
        
    def test_antibody_summary_by_refs_id(self):
        # query for a reference with antibodies (J:210584)
        r = tc.get('/summary/antibody', 
                   query_string={
                         'refs_id':'J:148991'
                    }
        )
        
        # check antibody mgiid
        assert 'MGI:5295248' in r.data, "check Antibody MGIID"
        
    
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AntibodySummaryTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
