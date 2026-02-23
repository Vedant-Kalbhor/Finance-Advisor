from sqlalchemy import create_engine, text, inspect
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

def _run_migrations():
    """
    Lightweight migration helper for development.
    Adds any missing columns to existing tables so we don't have to
    delete the database every time a model changes.
    SQLAlchemy's create_all only creates NEW tables, not new columns.
    """
    inspector = inspect(engine)

    # Only run if the profiles table already exists
    if "profiles" in inspector.get_table_names():
        existing_columns = [col["name"] for col in inspector.get_columns("profiles")]

        # Add 'location' column if it's missing
        if "location" not in existing_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN location VARCHAR DEFAULT ''"))
                print("[Migration] Added 'location' column to profiles table.")

def create_tables():
    # This automatically creates the .db file and all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Run lightweight migrations for any new columns on existing tables
    _run_migrations()
