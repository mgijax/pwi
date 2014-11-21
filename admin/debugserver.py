import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from pwi import app
import os
import socket
hostname=socket.gethostname()

# set as debug mode
os.environ["DEBUG"] = "True"

serverPort = int(os.environ["DEBUG_SERVER_PORT"])
app.run(debug=True,host=hostname,port=serverPort)
