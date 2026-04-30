#Jonathan Torres wrote 235 lines of code for this file
"""
Tests for the Calcura FastAPI backend.
Uses TestClient to test API endpoints against an in-memory SQLite database.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from main import app
from db.database import Base, get_db
import db.models  # registers all ORM models with Base.metadata


# -- Fixtures --

@pytest.fixture
def test_engine():
    """Create a test database engine.

    When DATABASE_URL set to a non-SQLite backend (used by the Postgres CI job)
    so the same suite exercises real Postgres semantics. Falls back to in-memory SQLite
    for fast local runs. Schema is dropped and recreated per test for isolation.
    """
    database_url = os.environ.get("DATABASE_URL", "")
    if database_url and not database_url.startswith("sqlite"):
        engine = create_engine(database_url)
    else:
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
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
    def test_root_returns_ok(self, client):
        response = client.get("/")
        assert response.status_code == 200


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

    def test_create_role(self, client):
        response = client.post("/roles/", json={
            "name": "admin",
            "description": "Full access",
            "permissions": "all"
        })
        assert response.status_code == 200
        assert response.json()["Message"] == "Role created successfully"

    def test_list_roles_after_create(self, client):
        client.post("/roles/", json={
            "name": "editor",
            "description": "Can edit content",
            "permissions": "read,write"
        })
        response = client.get("/roles/")
        assert response.status_code == 200
        roles = response.json()
        assert len(roles) == 1
        assert roles[0]["name"] == "editor"


# -- Permissions --

class TestPermissions:
    def test_list_permissions_empty(self, client):
        response = client.get("/permissions/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_permission(self, client):
        response = client.post("/permissions/", json={
            "permission_id": "read_budgets",
            "name": "Read Budgets",
            "description": "Allows reading budget data"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Permission created"

    def test_list_permissions_after_create(self, client):
        client.post("/permissions/", json={
            "permission_id": "write_budgets",
            "name": "Write Budgets",
            "description": "Allows writing budget data"
        })
        response = client.get("/permissions/")
        assert response.status_code == 200
        permissions = response.json()
        assert len(permissions) == 1
        assert permissions[0]["permission_id"] == "write_budgets"


# -- User Roles --

class TestUserRoles:
    def _setup_user_and_role(self, client):
        client.post("/users/", json={
            "name": "Role User",
            "email": "roleuser@example.com",
            "password": "pass",
            "age": 25
        })
        client.post("/roles/", json={
            "name": "admin",
            "description": "Full access",
            "permissions": "all"
        })

    def test_list_user_roles_empty(self, client):
        response = client.get("/user_roles/")
        assert response.status_code == 200
        assert response.json() == []

    def test_assign_role(self, client):
        self._setup_user_and_role(client)
        response = client.post("/user_roles/", json={
            "user_id": 1,
            "role_id": 1
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Role assigned to user"

    def test_list_user_roles_after_assign(self, client):
        self._setup_user_and_role(client)
        client.post("/user_roles/", json={"user_id": 1, "role_id": 1})
        response = client.get("/user_roles/")
        assert response.status_code == 200
        roles = response.json()
        assert len(roles) == 1
        assert roles[0]["user_id"] == 1
        assert roles[0]["role_id"] == 1


# -- Sessions --

class TestSessions:
    def _create_user(self, client):
        client.post("/users/", json={
            "name": "Session User",
            "email": "session@example.com",
            "password": "pass123",
            "age": 30
        })

    def test_list_sessions_empty(self, client):
        response = client.get("/sessions/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_session(self, client):
        self._create_user(client)
        response = client.post("/sessions/", json={
            "user_id": 1,
            "expires_on": "2099-12-31T23:59:59Z",
            "ip_address": "127.0.0.1",
            "user_agent": "TestClient"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Session created"

    def test_get_session(self, client):
        self._create_user(client)
        client.post("/sessions/", json={
            "user_id": 1,
            "expires_on": "2099-12-31T23:59:59Z"
        })
        response = client.get("/sessions/1")
        assert response.status_code == 200
        assert response.json()["user_id"] == 1

    def test_get_session_not_found(self, client):
        response = client.get("/sessions/999")
        assert response.status_code == 404

    def test_delete_session(self, client):
        self._create_user(client)
        client.post("/sessions/", json={
            "user_id": 1,
            "expires_on": "2099-12-31T23:59:59Z"
        })
        response = client.delete("/sessions/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Session deleted"

    def test_delete_session_not_found(self, client):
        response = client.delete("/sessions/999")
        assert response.status_code == 404

    def test_session_login(self, client):
        self._create_user(client)
        response = client.post("/sessions/login", json={
            "email": "session@example.com",
            "password": "pass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert data["user_id"] == 1
        assert "session_id" in data

    def test_session_login_wrong_password(self, client):
        self._create_user(client)
        response = client.post("/sessions/login", json={
            "email": "session@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401

    def test_session_login_nonexistent_user(self, client):
        response = client.post("/sessions/login", json={
            "email": "nobody@example.com",
            "password": "anything"
        })
        assert response.status_code == 401


# -- Categories --

class TestCategories:
    def _create_user(self, client):
        client.post("/users/", json={
            "name": "Cat User",
            "email": "cat@example.com",
            "password": "pass",
            "age": 25
        })

    def test_list_categories_empty(self, client):
        response = client.get("/categories/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_category(self, client):
        self._create_user(client)
        response = client.post("/categories/", json={
            "user_id": 1,
            "name": "Groceries",
            "type": "expenses"
        })
        assert response.status_code == 200
        assert "Groceries" in response.json()["message"]

    def test_get_category(self, client):
        self._create_user(client)
        client.post("/categories/", json={
            "user_id": 1,
            "name": "Salary",
            "type": "income"
        })
        response = client.get("/categories/1")
        assert response.status_code == 200
        assert response.json()["name"] == "Salary"
        assert response.json()["type"] == "income"

    def test_get_category_not_found(self, client):
        response = client.get("/categories/999")
        assert response.status_code == 404

    def test_update_category(self, client):
        self._create_user(client)
        client.post("/categories/", json={
            "user_id": 1,
            "name": "Food",
            "type": "expenses"
        })
        response = client.put("/categories/1", json={
            "name": "Groceries",
            "type": "expenses"
        })
        assert response.status_code == 200
        assert "Groceries" in response.json()["message"]

    def test_update_category_not_found(self, client):
        response = client.put("/categories/999", json={"name": "Nope"})
        assert response.status_code == 404

    def test_delete_category(self, client):
        self._create_user(client)
        client.post("/categories/", json={
            "user_id": 1,
            "name": "Temp",
            "type": "expenses"
        })
        response = client.delete("/categories/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Category deleted"

    def test_delete_category_not_found(self, client):
        response = client.delete("/categories/999")
        assert response.status_code == 404

    def test_create_category_invalid_type(self, client):
        self._create_user(client)
        response = client.post("/categories/", json={
            "user_id": 1,
            "name": "Bad Category",
            "type": "invalid_type"
        })
        assert response.status_code == 422


# -- Templates --

class TestTemplates:
    def _setup(self, client):
        """Create a user and seed lifecycle stages for template tests."""
        client.post("/users/", json={
            "name": "Template User",
            "email": "template@example.com",
            "password": "pass",
            "age": 25
        })
        # Seed lifecycle stages directly via the test database
        from db.models import LifecycleStage
        override_fn = app.dependency_overrides[get_db]
        db_gen = override_fn()
        db_session = next(db_gen)
        stages = [
            LifecycleStage(stage_id=1, name="young adult", stage="young_adult",
                           display_label="Young Adult (18-30)", sort_order=1, is_active=True),
            LifecycleStage(stage_id=2, name="career", stage="career",
                           display_label="Career (30-55)", sort_order=2, is_active=True),
            LifecycleStage(stage_id=3, name="retirement", stage="retirement",
                           display_label="Retirement (55+)", sort_order=3, is_active=True),
        ]
        for stage in stages:
            db_session.add(stage)
        db_session.commit()
        db_session.close()

    def test_list_templates_empty(self, client):
        response = client.get("/templates/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_template(self, client):
        self._setup(client)
        response = client.post("/templates/", json={
            "user_id": 1,
            "name": "Monthly Budget",
            "stage_id": 1,
            "is_default": False
        })
        assert response.status_code == 200
        data = response.json()
        assert "young adult" in data["message"]
        assert "template_id" in data

    def test_get_template(self, client):
        self._setup(client)
        client.post("/templates/", json={
            "user_id": 1,
            "name": "Starter Template",
            "stage_id": 2,
            "is_default": True
        })
        response = client.get("/templates/1")
        assert response.status_code == 200
        assert response.json()["name"] == "Starter Template"
        assert response.json()["stage_id"] == 2
        assert response.json()["is_default"] is True

    def test_get_template_not_found(self, client):
        response = client.get("/templates/999")
        assert response.status_code == 404

    def test_update_template(self, client):
        self._setup(client)
        client.post("/templates/", json={
            "user_id": 1,
            "name": "Old Name",
            "stage_id": 1,
            "is_default": False
        })
        response = client.put("/templates/1", json={
            "name": "New Name",
            "stage_id": 2
        })
        assert response.status_code == 200
        assert "career" in response.json()["message"]

    def test_update_template_not_found(self, client):
        response = client.put("/templates/999", json={"name": "Nope"})
        assert response.status_code == 404

    def test_delete_template(self, client):
        self._setup(client)
        client.post("/templates/", json={
            "user_id": 1,
            "name": "Temp",
            "stage_id": 1,
            "is_default": False
        })
        response = client.delete("/templates/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Template deleted"

    def test_delete_template_not_found(self, client):
        response = client.delete("/templates/999")
        assert response.status_code == 404

    def test_create_template_invalid_stage(self, client):
        self._setup(client)
        response = client.post("/templates/", json={
            "user_id": 1,
            "name": "Bad Stage",
            "stage_id": 99,
            "is_default": False
        })
        assert response.status_code == 422


# -- Template Items --

class TestTemplateItems:
    def _setup(self, client):
        """Create user, lifecycle stages, category, and template for item tests."""
        client.post("/users/", json={
            "name": "Item User",
            "email": "item@example.com",
            "password": "pass",
            "age": 25
        })
        # Seed lifecycle stages
        from db.models import LifecycleStage
        override_fn = app.dependency_overrides[get_db]
        db_gen = override_fn()
        db_session = next(db_gen)
        db_session.add(LifecycleStage(
            stage_id=1, name="young adult", stage="young_adult",
            display_label="Young Adult (18-30)", sort_order=1, is_active=True
        ))
        db_session.commit()
        db_session.close()
        # Create category and template
        client.post("/categories/", json={
            "user_id": 1,
            "name": "Rent",
            "type": "expenses"
        })
        client.post("/templates/", json={
            "user_id": 1,
            "name": "Monthly",
            "stage_id": 1,
            "is_default": False
        })

    def test_list_template_items_empty(self, client):
        response = client.get("/template_items/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_template_item(self, client):
        self._setup(client)
        response = client.post("/template_items/", json={
            "template_id": 1,
            "category_id": 1,
            "planned_amt": 1500.00,
            "item_name": "Monthly Rent"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Template item created"
        assert "item_id" in data

    def test_get_template_item(self, client):
        self._setup(client)
        client.post("/template_items/", json={
            "template_id": 1,
            "category_id": 1,
            "planned_amt": 200.50,
            "item_name": "Utilities"
        })
        response = client.get("/template_items/1")
        assert response.status_code == 200
        data = response.json()
        assert data["planned_amt"] == 200.50
        assert data["item_name"] == "Utilities"

    def test_get_template_item_not_found(self, client):
        response = client.get("/template_items/999")
        assert response.status_code == 404

    def test_update_template_item(self, client):
        self._setup(client)
        client.post("/template_items/", json={
            "template_id": 1,
            "category_id": 1,
            "planned_amt": 100.00,
            "item_name": "Old Item"
        })
        response = client.put("/template_items/1", json={
            "planned_amt": 150.00,
            "item_name": "Updated Item"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Template item updated"

    def test_update_template_item_not_found(self, client):
        response = client.put("/template_items/999", json={"planned_amt": 50.00})
        assert response.status_code == 404

    def test_delete_template_item(self, client):
        self._setup(client)
        client.post("/template_items/", json={
            "template_id": 1,
            "category_id": 1,
            "planned_amt": 75.00
        })
        response = client.delete("/template_items/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Template item deleted"

    def test_delete_template_item_not_found(self, client):
        response = client.delete("/template_items/999")
        assert response.status_code == 404


# -- End-to-End Workflow --

class TestEndToEndWorkflow:
    """Register -> login -> create budget -> create category -> create template -> add template item."""

    def _seed_lifecycle_stages(self, client):
        from db.models import LifecycleStage
        override_fn = app.dependency_overrides[get_db]
        db_gen = override_fn()
        db_session = next(db_gen)
        db_session.add(LifecycleStage(
            stage_id=1, name="young adult", stage="young_adult",
            display_label="Young Adult (18-30)", sort_order=1, is_active=True
        ))
        db_session.commit()
        db_session.close()

    def test_full_workflow(self, client):
        self._seed_lifecycle_stages(client)

        # 1. Register
        reg = client.post("/users/", json={
            "name": "Workflow User",
            "email": "workflow@example.com",
            "password": "securepass",
            "age": 28
        })
        assert reg.status_code == 200
        user_id = reg.json()["user_id"]

        # 2. Login
        login = client.post("/users/login", json={
            "email": "workflow@example.com",
            "password": "securepass"
        })
        assert login.status_code == 200
        assert login.json()["message"] == "Login successful"

        # 3. Create budget
        budget = client.post("/budgets/", json={
            "user_id": user_id,
            "period_start": "2026-05-01",
            "period_end": "2026-05-31"
        })
        assert budget.status_code == 200

        # 4. Create category
        category = client.post("/categories/", json={
            "user_id": user_id,
            "name": "Housing",
            "type": "expenses"
        })
        assert category.status_code == 200

        # 5. Create template
        template = client.post("/templates/", json={
            "user_id": user_id,
            "name": "May Budget Template",
            "stage_id": 1,
            "is_default": False
        })
        assert template.status_code == 200
        template_id = template.json()["template_id"]

        # 6. Add template item
        item = client.post("/template_items/", json={
            "template_id": template_id,
            "category_id": 1,
            "planned_amt": 1200.00,
            "item_name": "Rent"
        })
        assert item.status_code == 200

        # 7. Verify everything is retrievable
        assert client.get("/budgets/1").status_code == 200
        assert client.get("/categories/1").status_code == 200
        assert client.get(f"/templates/{template_id}").status_code == 200
        assert client.get(f"/template_items/{item.json()['item_id']}").status_code == 200
