"""
Run all PWI API module test suites
"""
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest

# import all sub test suites
import reference_api_tests
import user_api_tests

# add the test suites
def master_suite():
    suites = []
    suites.append(reference_api_tests.suite())
    suites.append(user_api_tests.suite())
    
    master_suite = unittest.TestSuite(suites)
    return master_suite

if __name__ == '__main__':
	test_suite = master_suite()
	runner = unittest.TextTestRunner()
	
	ret = not runner.run(test_suite).wasSuccessful()
	sys.exit(ret)
