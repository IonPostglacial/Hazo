from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session


DB_FILE = 'sqlite:///hub.sq3'

engine = create_engine(DB_FILE, connect_args={ "check_same_thread": False })
LocalSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
BaseModel = declarative_base()
session = scoped_session(LocalSession)