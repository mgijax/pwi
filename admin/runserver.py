import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from cherrypy import wsgiserver,tools
from pwi import app
import os
import socket
hostname=socket.gethostname()

# set as prod mode
os.environ["DEBUG"] = "False"

serverPort = int(os.environ["SERVER_PORT"])
#tools.sessions.locking='explicit'
d = wsgiserver.WSGIPathInfoDispatcher({'/': app})
server = wsgiserver.CherryPyWSGIServer((hostname, serverPort), d)

if __name__ == '__main__':
	try:
		server.start()
	except KeyboardInterrupt:
		server.stop()
