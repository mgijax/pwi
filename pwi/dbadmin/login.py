#
# functions related to logging into the database system
#
from pwi import app
from mgipython.modelconfig import db


def dbLogin(user,password):
    """
    returns if user can login
    Does so by using sqlalchemy connect on the 
        appropriate db engine
    If successful, returns the session bound to
        created engine
    """
    dburi = ""

    dburi = "postgresql+psycopg2://%s:%s@%s/%s" % \
        (user,
        password,
        app.config['PG_SERVER'],
        app.config['PG_DBNAME'])
         
    # try to connect
    session = None
    try:
        engine = db.create_engine(dburi)
        engine.connect()
         
        session = db.scoped_session(
            db.sessionmaker(autocommit=False, 
                        autoflush=False, 
                        bind=engine)
        )
    except:
        return False
 
    return session