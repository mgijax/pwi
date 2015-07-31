import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import cherrypy
import os
import socket

# set production config environment
rootDir = os.environ['PWI']
os.environ['APP_CONFIG_FILE'] = os.path.join(rootDir, 'config', 'prod.config.py')

from pwi import app

hostname=socket.gethostname()

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
    
