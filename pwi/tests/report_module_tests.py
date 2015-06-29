"""
Test all the CRUD operations of the report module
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# adjust the app_prefix for relative url testing
os.environ['APP_PREFIX'] = ''

import unittest
from pwi import app
from pwi.model.appmodel import Report
from pwi.model.query import dbLogin

TEST_REPORT_NAME='autotest (delete me) 45'
DBO_USER = app.config['TEST_DBO_USER']
DBO_PASS = app.config['TEST_DBO_PASS']

def makeGenericReport(labels='unit testing,delete me'):
    return { 'rpt_sql_text':'select * from mgi_dbinfo',
            'rpt_name':TEST_REPORT_NAME,
            'rpt_requested_by':'Tester',
            'rpt_report_author':DBO_USER,
            'rpt_tags':labels }

tc = app.test_client()
class ReportModuleTestCase(unittest.TestCase):

    def setUp(self):
        # init session to be dbo, unless otherwise changed
        with tc.session_transaction() as sess:
            sess['user'] = DBO_USER
            sess['password'] = DBO_PASS
            
    def tearDown(self):
        # ensure that any created reports are deleted
        with tc.session_transaction() as sess:
            sess['user'] = DBO_USER
            sess['password'] = DBO_PASS
        reports = Report.query.filter_by(name=TEST_REPORT_NAME).all()
        for report in reports:
            r = tc.get('/report/deletereport/%s'%report.id)
            
    ### Tests ###
            
    def test_root_url(self):
        r = tc.get('/report/index',follow_redirects=True)
        assert 'Custom Report Index' in r.data
        assert 'Requested By' in r.data

    def test_labels_view(self):
        # add some reports with labels
        r = tc.post('/report/savereport',data=makeGenericReport(labels='*&^%$#090, ###QwErTy'),follow_redirects=True)
        r = tc.post('/report/savereport',data=makeGenericReport(labels='###QwErTy'),follow_redirects=True)
        r = tc.post('/report/savereport',data=makeGenericReport(labels='(##DELETE_ME_)'),follow_redirects=True)

        # test the all labels view
        r = tc.get('/report/index')
        assert '*&^%$#090' in r.data
        assert '###qwerty' in r.data
        assert '(##delete_me_)' in r.data
        
    def test_edit_labels(self):
        # add a report with labels
        rpt = makeGenericReport(labels='##delete_me1##')
        r = tc.post('/report/savereport',data=rpt,follow_redirects=True)
        
        # fetch the saved report for editing
        reports = Report.query.filter_by(name=TEST_REPORT_NAME).all()
        # should have only save one
        self.assertEquals(1, len(reports), 
                'should only have saved one report with name=%s, but found %d' \
                % (TEST_REPORT_NAME, len(reports)) )
        
        # now change the labels
        rpt['rpt_report_id'] = reports[0].id
        rpt['rpt_tags'] = '##delete_me2##, ##delete_me3##'
        r = tc.post('/report/savereport',data=rpt,follow_redirects=True)
        
        # test the new labels got set
        assert '##delete_me1##' not in r.data
        assert '##delete_me2##' in r.data
        assert '##delete_me3##' in r.data

    # Test creating a report
    def test_add_report(self):
        r = tc.post('/report/savereport',data=makeGenericReport(),follow_redirects=True)
        assert 'select * from mgi_dbinfo' in r.data
        assert 'schema_version' in r.data

    # Test deleting a report
    def test_delete_report(self):
        r = tc.post('/report/savereport',data=makeGenericReport(),follow_redirects=True)
        reports = Report.query.filter_by(name=TEST_REPORT_NAME).all()
        assert len(reports) > 0
        for report in reports:
            r = tc.get('/report/deletereport/%s'%report.id)
            assert 'deleted report' in r.data
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ReportModuleTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
