"""
Run all PWI test suites
"""
import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# disable SQLAlchemy Warnings
import warnings
from sqlalchemy.exc import SAWarning
warnings.filterwarnings('ignore', category=SAWarning)

import unittest

# import all sub test suites
import general_tests
import accession_tests
import allele_detail_tests
import allele_summary_tests
import antibody_summary_tests
import antibody_detail_tests
import assay_detail_tests
from edit import emapa_browser_tests
import experiment_detail_tests
import experiment_summary_tests
import filter_tests
import gxd_summary_tests
import marker_detail_tests
import marker_summary_tests
import reference_summary_tests
import probe_detail_tests
import probe_summary_tests
import result_summary_tests
import sequence_summary_tests

from hunter import genotype_mp_hunter_tests

# add the test suites
def master_suite():
	suites = []
	suites.append(general_tests.suite())
	suites.append(accession_tests.suite())
	suites.append(allele_detail_tests.suite())
	suites.append(allele_summary_tests.suite())
	suites.append(antibody_detail_tests.suite())
	suites.append(antibody_summary_tests.suite())
	suites.append(assay_detail_tests.suite())
	suites.append(emapa_browser_tests.suite())
	suites.append(experiment_detail_tests.suite())
	suites.append(experiment_summary_tests.suite())
	suites.append(filter_tests.suite())
	suites.append(gxd_summary_tests.suite())
	suites.append(marker_detail_tests.suite())
	suites.append(marker_summary_tests.suite())
	suites.append(reference_summary_tests.suite())
	suites.append(probe_detail_tests.suite())
	suites.append(probe_summary_tests.suite())
	suites.append(result_summary_tests.suite())
	suites.append(genotype_mp_hunter_tests.suite())
	suites.append(sequence_summary_tests.suite())
	
	master_suite = unittest.TestSuite(suites)
	return master_suite

if __name__ == '__main__':
	test_suite = master_suite()
	runner = unittest.TextTestRunner()
	
	ret = not runner.run(test_suite).wasSuccessful()
	sys.exit(ret)
