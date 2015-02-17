import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import cherrypy
from pwi import app
import os
import socket
hostname=socket.gethostname()

# set as prod mode
os.environ["DEBUG"] = "False"

serverPort = int(os.environ["SERVER_PORT"])

# cherrypy config
cherrypy.tree.graft(app, '/')
cherrypy.config.update({
    'server.socket_host': hostname,
    'server.socket_port': serverPort
})

if __name__ == '__main__':
    cherrypy.engine.start()
    cherrypy.engine.block()
    