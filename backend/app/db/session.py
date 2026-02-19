from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# We are using SQLite exclusively for simplicity and local development.
# It handles thousands of transactions easily and requires zero setup.
DATABASE_URL = "sqlite:///./finance.db"

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    # This automatically creates the .db file and all tables if they don't exist
    Base.metadata.create_all(bind=engine)
