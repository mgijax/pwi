"""
Test all the CRUD operations of the report module
"""
import test_config

import unittest
from pwi import app
from mgipython.model.appmodel import Report
from mgipython.model import MGIUser
from mgipython.modelconfig import db
import flask_login

TEST_REPORT_NAME='autotest (delete me) 45'
DBO_USER = app.config['PG_USER']
DBO_PASS = app.config['PG_PASS']

def makeGenericReport(labels='unit testing,delete me'):
    return { 'rpt_sql_text':'select * from mgi_dbinfo',
            'rpt_name':TEST_REPORT_NAME,
            'rpt_requested_by':'Tester',
            'rpt_report_author':DBO_USER,
            'rpt_tags':labels }

tc = app.test_client()
class ReportModuleTestCase(unittest.TestCase):

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
        reports = Report.query.filter_by(name=TEST_REPORT_NAME).all()
        report_ids = [report.id for report in reports]
        for id in report_ids:
            r = tc.get('/report/deletereport/%s'%id)
            
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
