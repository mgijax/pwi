"""
Run all PWI test suites
"""
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# disable SQLAlchemy Warnings
import warnings
from sqlalchemy.exc import SAWarning
warnings.filterwarnings('ignore', category=SAWarning)

import unittest

# import all sub test suites
import general_tests
import accession_tests
import marker_detail_tests
import marker_summary_tests

# add the test suites
def master_suite():
	suites = []
	suites.append(general_tests.suite())
	suites.append(accession_tests.suite())
	suites.append(marker_detail_tests.suite())
	suites.append(marker_summary_tests.suite())
	master_suite = unittest.TestSuite(suites)
	return master_suite

if __name__ == '__main__':
	test_suite = master_suite()
	runner = unittest.TextTestRunner()
	runner.run(test_suite)