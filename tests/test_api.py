#Jonathan Torres wrote 235 lines of code for this file
"""
Tests for the Calcura FastAPI backend.
Uses TestClient to test API endpoints against an in-memory SQLite database.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from testapp import app
from db.database import Base, get_db
import db.models  # registers all ORM models with Base.metadata


# -- Fixtures --

@pytest.fixture
def test_engine():
    """Create an in-memory SQLite engine with all ORM tables."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(test_engine):
    """Create a test client with the test database injected."""
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# -- Root endpoint --

class TestRoot:
    def test_root_returns_welcome(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Welcome to the Calcura API"}


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
