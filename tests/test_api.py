#Jonathan Torres wrote 235 lines of code for this file
"""
Tests for the Calcura FastAPI backend.
Uses TestClient to test API endpoints against an in-memory SQLite database.
"""

import sqlite3
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
# Modified by Jonathan Torres: renamed testapp -> main
from main import app


# -- Fixtures --

DB_URI = "file:test_db?mode=memory&cache=shared"


@pytest.fixture
def mock_db():
    """Create a shared in-memory SQLite database with the required schema."""
    conn = sqlite3.connect(DB_URI, uri=True, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            mfa_secret TEXT,
            age INTEGER,
            is_active INTEGER DEFAULT 1,
            created_on TEXT,
            updated_on TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            period_start TEXT,
            period_end TEXT,
            template_id INTEGER,
            created_on TEXT,
            updated_on TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            budget_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            planned_amount REAL DEFAULT 0,
            created_on TEXT,
            updated_on TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            role_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_on TEXT,
            updated_on TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_on TEXT,
            updated_on TEXT
        )
    """)
    conn.commit()
    yield conn
    # Clean up tables between tests
    for table in ["Users", "budgets", "categories", "roles", "permissions"]:
        conn.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()


@pytest.fixture
def client(mock_db):
    """Create a test client with a mocked database connection."""
    def get_mock_connection():
        conn = sqlite3.connect(DB_URI, uri=True, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    with patch("databasev1.get_connection", get_mock_connection):
        # Patch each router's imported get_connection
        with patch("routers.users.get_connection", get_mock_connection), \
             patch("routers.budgets.get_connection", get_mock_connection), \
             patch("routers.categories.get_connection", get_mock_connection), \
             patch("routers.roles.get_connection", get_mock_connection), \
             patch("routers.permissions.get_connection", get_mock_connection), \
             patch("routers.sessions.get_connection", get_mock_connection), \
             patch("routers.user_roles.get_connection", get_mock_connection), \
             patch("routers.templates.get_connection", get_mock_connection), \
             patch("routers.template_items.get_connection", get_mock_connection):
            yield TestClient(app)

# Modified by Jonathan Torres to remove Root endpoint tests since it was removed from the API. If we want to add it back, we can add tests for it here.

# -- Users --

class TestUsers:
    def test_list_users_empty(self, client):
        response = client.get("/users/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_user(self, client):
        response = client.post("/users/", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "secret123",
            "age": 25
        })
        assert response.status_code == 200
        assert response.json()["Message"] == "User created successfully"

    def test_list_users_after_create(self, client):
        client.post("/users/", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "secret123",
            "age": 25
        })
        response = client.get("/users/")
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 1
        assert users[0]["email"] == "test@example.com"

    def test_login_success(self, client):
        client.post("/users/", json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "mypassword",
            "age": 30
        })
        response = client.post("/users/login", json={
            "email": "login@example.com",
            "password": "mypassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert data["email"] == "login@example.com"

    def test_login_wrong_password(self, client):
        client.post("/users/", json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "mypassword",
            "age": 30
        })
        response = client.post("/users/login", json={
            "email": "login@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/users/login", json={
            "email": "nobody@example.com",
            "password": "anything"
        })
        assert response.status_code == 401


# -- Budgets --

class TestBudgets:
    def _create_user(self, client):
        client.post("/users/", json={
            "name": "Budget User",
            "email": "budget@example.com",
            "password": "pass",
            "age": 25
        })

    def test_list_budgets_empty(self, client):
        response = client.get("/budgets/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_budget(self, client):
        self._create_user(client)
        response = client.post("/budgets/", json={
            "user_id": 1,
            "period_start": "2026-01-01",
            "period_end": "2026-01-31"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Budget created"

    def test_get_budget(self, client):
        self._create_user(client)
        client.post("/budgets/", json={
            "user_id": 1,
            "period_start": "2026-01-01",
            "period_end": "2026-01-31"
        })
        response = client.get("/budgets/1")
        assert response.status_code == 200
        assert response.json()["period_start"] == "2026-01-01"

    def test_get_budget_not_found(self, client):
        response = client.get("/budgets/999")
        assert response.status_code == 404

    def test_delete_budget(self, client):
        self._create_user(client)
        client.post("/budgets/", json={
            "user_id": 1,
            "period_start": "2026-01-01",
            "period_end": "2026-01-31"
        })
        response = client.delete("/budgets/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Budget deleted"


# -- Roles --

class TestRoles:
    def test_list_roles_empty(self, client):
        response = client.get("/roles/")
        assert response.status_code == 200
        assert response.json() == []
