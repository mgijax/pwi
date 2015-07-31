# Configuration before tests can be run manually

import sys
import os
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# set test config environment
rootDir = os.environ['PWI']
os.environ['APP_CONFIG_FILE'] = os.path.join(rootDir, 'config', 'test.config.py')
