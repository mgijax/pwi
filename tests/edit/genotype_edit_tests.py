"""
Test the editting MP Annotations
"""

import sys
import os
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest

from pwi import app


TEST_REPORT_NAME='autotest (delete me) 45'
DBO_USER = app.config['PG_USER']
DBO_PASS = app.config['PG_PASS']

tc = app.test_client()
class MPAnnotationEditTestCase(unittest.TestCase):

    ### Helpers ###

    def login(self, user):
        return tc.post('/login', data=dict(
            user=user,
            password='' # no password for tests
        ), follow_redirects=True)

    def logout(self):
           return tc.get('/logout', follow_redirects=True)

    ### setUp / tearDown ###

    def setUp(self):
         self.login(DBO_USER)
            
    def tearDown(self):
        # ensure that any created reports are deleted
        self.login(DBO_USER)
        
        # delete any added annotations
        r = tc.post('/edit/genotype/MGI:2174706/annotations/delete',
                    data=dict(
                        termAccId='MP:0005459', # decreased body fat
                        qualifier='',
                        refJnum='J:2',
                        sex='NA'
                    ),
                    follow_redirects=True)
            
    ### Tests ###
            
    def test_view_existing_annotations(self):
        # Old genotype Pkd2<tm2Som>/Pkd2<+>
        r = tc.get('/edit/genotype/MGI:2174706/annotations',follow_redirects=True)
        
        assert 'Pkd2' in r.data, "check Allele symbol"
        assert 'involves: 129/Sv' in r.data, "check genetic background"
        assert 'MP:0003675' in r.data, "check Term ID"
        assert 'kidney cysts' in r.data, "check Term"
        assert 'J:59314' in r.data, "check Ref J Number"
        assert 'Wu G, Nat Genet' in r.data, "check Ref Citation"
        assert 'monikat' in r.data, "check modified by"
        assert 'csmith' in r.data, "check created by"
        

    def test_add_annotation(self):
        # Old genotype Pkd2<tm2Som>/Pkd2<+>
        # add fake annotation
        r = tc.post('/edit/genotype/MGI:2174706/annotations/add',
                    data=dict(
                        termAccId='MP:0005459', # decreased body fat
                        qualifier='',
                        refJnum='J:2',
                        sex='NA'
                    ),
                    follow_redirects=True)
        
        assert 'MP:0005459', "check term ID"
        assert 'decreased percent body fat', "check term"
        assert 'J:2', "check Reference"
        assert 'mgd_dbo', "check created/modified by"
        
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(MPAnnotationEditTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
