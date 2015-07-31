import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import os
import socket

# set development config environment
rootDir = os.environ['PWI']
os.environ['APP_CONFIG_FILE'] = os.path.join(rootDir, 'config', 'dev.config.py')
from pwi import app

hostname=socket.gethostname()


serverPort = int(os.environ["DEV_SERVER_PORT"])
app.run(debug=True,host=hostname,port=serverPort)
