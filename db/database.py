import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_DIR = os.path.join(BASE_DIR, "Database")
DEFAULT_DB_PATH = os.path.join(DEFAULT_DB_DIR, "CalcuraV1.db")
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH}"

# Ensure the Database directory exists so SQLite can create the file
os.makedirs(DEFAULT_DB_DIR, exist_ok=True)

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

# SQLite needs check_same_thread=False for FastAPI's threaded request handling
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session per request."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
