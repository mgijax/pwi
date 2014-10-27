"""
 testing out Flask's unit test framework
"""
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# disable SQLAlchemy Warnings
import warnings
from sqlalchemy.exc import SAWarning
warnings.filterwarnings('ignore', category=SAWarning)

import unittest
from pwi import app

tc = app.test_client()
class pwiTestCase(unittest.TestCase):
	def test_root_url(self):
		r = tc.get('/')
		assert 'Web SQL' in r.data
		assert 'Query Forms' in r.data

	# Test the websql blueprint
	def test_websql(self):
		r = tc.post('/websql/',data={
			'sqlText':"SELECT * FROM ACC_MGITYPE"
		})
		# check that a column from the query is displayed
		assert 'creation_date' in r.data
		# check that a data element from the query is displayed
		assert 'Annotation Evidence' in r.data

	# test a marker summary
	def test_marker_summary(self):
		r = tc.post('/query/markerform/summary/',data={
			'symbol':'Pax4'
		})
		assert 'Pax4' in r.data
		assert 'mouse, laboratory' in r.data

	# test a marker detail
	def test_marker_detail(self):
		r = tc.get('/detail/marker/key/12182')
		#test symbol
		assert 'Pax4' in r.data
		# test name
		assert 'paired box 4' in r.data
		# test feature type
		assert 'protein coding gene' in r.data
		# test location
		assert 'Chr6' in r.data
		# test detail clip
		assert 'Mice homozygous for this targeted mutation' in r.data

	# test an allele detail
	def test_allele_detail(self):
		r = tc.get('/detail/allele/key/11182')
		#print r.data
		assert 'Pax4&lt;+&gt;' in r.data
		assert 'wild type' in r.data

if __name__ == '__main__':
	unittest.main()
