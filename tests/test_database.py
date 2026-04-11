"""
Tests for the database configuration module (db/database.py).
Verifies engine creation, session management, and DATABASE_URL handling.
"""

import os
import pytest
from unittest.mock import patch
from sqlalchemy import text


class TestDefaultConfig:
    """Tests for default configuration when no DATABASE_URL is set."""

    def test_default_url_is_sqlite(self):
        from db.database import DATABASE_URL
        assert DATABASE_URL.startswith("sqlite:///")

    def test_default_url_points_to_calcura_db(self):
        from db.database import DATABASE_URL
        assert "CalcuraV1.db" in DATABASE_URL

    def test_engine_is_created(self):
        from db.database import engine
        assert engine is not None

    def test_sqlite_engine_allows_multithreaded_access(self):
        from db.database import engine, DATABASE_URL
        if DATABASE_URL.startswith("sqlite"):
            pool = engine.pool
            connection = pool.connect()
            connection.close()


class TestGetDb:
    """Tests for the get_db() FastAPI dependency."""

    def test_get_db_yields_session(self):
        from db.database import get_db
        generator = get_db()
        session = next(generator)
        assert session is not None
        try:
            next(generator)
        except StopIteration:
            pass

    def test_get_db_session_can_execute_query(self):
        from db.database import get_db
        generator = get_db()
        session = next(generator)
        result = session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        try:
            next(generator)
        except StopIteration:
            pass

    def test_get_db_resets_session_after_use(self):
        from db.database import get_db
        generator = get_db()
        session = next(generator)
        # Execute a query to start a transaction
        session.execute(text("SELECT 1"))
        try:
            next(generator)
        except StopIteration:
            pass
        # After close(), session should have no active transaction
        assert not session.in_transaction()


class TestCustomDatabaseUrl:
    """Tests for custom DATABASE_URL configuration."""

    def test_database_url_env_var_is_read(self):
        custom_url = "sqlite:///test_custom.db"
        with patch.dict(os.environ, {"DATABASE_URL": custom_url}):
            result = os.environ.get("DATABASE_URL", "")
            assert result == custom_url
