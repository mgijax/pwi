"""
Run all PWI edit module test suites
"""
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest

# import all sub test suites
import emapa_browser_tests

from tests import report_module_tests

# add the test suites
def master_suite():
	suites = []
	suites.append(emapa_browser_tests.suite())
	suites.append(report_module_tests.suite())
	
	master_suite = unittest.TestSuite(suites)
	return master_suite

if __name__ == '__main__':
	test_suite = master_suite()
	runner = unittest.TextTestRunner()
	
	ret = not runner.run(test_suite).wasSuccessful()
	sys.exit(ret)
