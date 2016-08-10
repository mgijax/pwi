"""
Set up logging for the pwi
"""
import logging
import os
from mgipython import logger as mgipython_logger

def setup(app):
    """
    Sets up logging handlers for the pwi app
    
    1) Sets level and handler for mgipython library logging
    2) WRITE_APP_LOG determines if we write to a file
    3) EMAIL_ON_ERROR deterimines if we send email on errors
    """
    
    # open up global logger so we can fine tune the individual handlers
    app.logger.setLevel(logging.DEBUG)
    mgipython_logger.setLevel(logging.DEBUG)
    
    ch = logging.StreamHandler()
    mgipython_logger.addHandler(ch)
    
    # configure logging when not in debug mode
    if 'WRITE_APP_LOG' in app.config and app.config['WRITE_APP_LOG']:
        
        # make a file logger that rotates every day
        from logging.handlers import TimedRotatingFileHandler
        file_handler = TimedRotatingFileHandler(os.path.join(LOG_DIR, "app.log"),
                                    when='D',
                                    interval=1,
                                    backupCount=14)
        
        
        # set the logging level for the app log
        logLevel = logging.WARNING
        if 'LOG_LEVEL' in app.config:
            logLevelConfig = app.config['LOG_LEVEL'].lower()
            if logLevelConfig == 'debug':
                logLevel = logging.DEBUG
            elif logLevelConfig == 'info':
                logLevel = logging.INFO
            elif logLevelConfig == 'warn' or logLevel == 'warning':
                logLevel = logging.WARNING
            elif logLevelConfig == 'error':
                logLevel = logging.ERROR
                
            
        mgipython_logger.setLevel(logLevel)
        file_handler.setLevel(logLevel)
        
        formatter = logging.Formatter('%(asctime)s %(levelname)s] - %(message)s')
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
        
        from flask import request
        @app.before_request
        def log_requests():
            app.logger.info("ACCESS - \"%s\"" % request.path)
            
    if 'EMAIL_ON_ERROR' in app.config and app.config['EMAIL_ON_ERROR']:
        
         # send email to ERROR_EMAIL on any error occurrence
        from logging.handlers import SMTPHandler
        mail_handler = SMTPHandler('smtp.jax.org',
                                   'pwi-error@informatics.jax.org',
                                   ERROR_EMAIL.split(','), 'PWI Error')
        mail_handler.setLevel(logging.ERROR)
        app.logger.addHandler(mail_handler)
