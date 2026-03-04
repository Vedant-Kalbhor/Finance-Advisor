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

        # Add new columns if missing
        new_cols = {
            "location": "VARCHAR DEFAULT ''",
            "tax_regime": "VARCHAR DEFAULT 'New'",
            "deductions_80c": "FLOAT DEFAULT 0.0",
            "deductions_80d": "FLOAT DEFAULT 0.0",
            "other_deductions": "FLOAT DEFAULT 0.0"
        }
        
        for col, col_type in new_cols.items():
            if col not in existing_columns:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col} {col_type}"))
                    print(f"[Migration] Added '{col}' column to profiles table.")

    # Migration for investments table
    if "investments" in inspector.get_table_names():
        existing_invest_cols = [col["name"] for col in inspector.get_columns("investments")]
        invest_cols = {
            "goal_id": "INTEGER REFERENCES goals(id)",
            "is_tax_saving": "BOOLEAN DEFAULT FALSE"
        }
        for col, col_type in invest_cols.items():
            if col not in existing_invest_cols:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE investments ADD COLUMN {col} {col_type}"))
                    print(f"[Migration] Added '{col}' column to investments table.")

def create_tables():
    # This automatically creates the .db file and all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Run lightweight migrations for any new columns on existing tables
    _run_migrations()
