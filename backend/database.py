"""Database configuration and session management for UCS Rides."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'ucs_rides.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend.models import User, Vehicle, Ride, Payment  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _run_light_migrations()
    from backend.seed import seed_demo_data
    seed_demo_data()


def _run_light_migrations():
    """Add columns introduced after a table was first created (SQLite-safe)."""
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    if "rides" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("rides")}
    additions = {
        "preferences": "TEXT DEFAULT '[]'",
    }
    with engine.begin() as conn:
        for name, ddl in additions.items():
            if name not in cols:
                conn.execute(text(f"ALTER TABLE rides ADD COLUMN {name} {ddl}"))
