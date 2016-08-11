import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import os
import socket
from watchdog.observers import Observer
from watchdog.tricks import ShellCommandTrick
import warnings
from flask.exthook import ExtDeprecationWarning

# temporarily disable flask.ext deprecation warnings
warnings.simplefilter('ignore', ExtDeprecationWarning)

# set development config environment
rootDir = os.environ['PWI']
app_config_file = os.path.join(rootDir, 'config', 'dev.config.py')
os.environ['APP_CONFIG_FILE'] = app_config_file
from pwi import app

hostname=socket.gethostname()
serverPort = int(os.environ["DEV_SERVER_PORT"])


def main():
    
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        # stuff to run only once
        watch_mgipython()
        
    start_server()
    
def watch_mgipython():
    
    # start monitoring MGIPYTHONLIB for file changes
    # a change will trigger mgipython to rebuild
    #  this in turn forces the dev server to restart
    try:
        mgipython_dir = os.environ['MGIPYTHONLIB']
        mgipython_src_dir = os.path.join(mgipython_dir, 'mgipython')
    
        handler = ShellCommandTrick(
            shell_command="cd %s; ./rebuild; touch %s" % (mgipython_dir, app_config_file),
            #shell_command="echo 'hi'",
            patterns=["*.py"]
        )

        mgipython_observer = Observer()
        mgipython_observer.schedule(handler, mgipython_src_dir, recursive=True)
        mgipython_observer.start()
 
    except KeyError as e:
        return
   
    
    
def start_server():
    app.run(debug=True,
        host=hostname,
        port=serverPort
    )
    

if __name__ == "__main__":
    main()

