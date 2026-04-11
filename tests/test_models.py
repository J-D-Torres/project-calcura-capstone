"""
Tests for the SQLAlchemy ORM models (db/models.py).
Verifies table registration, schema accuracy, and foreign key relationships.
"""

import pytest
from sqlalchemy import create_engine, inspect
from db.database import Base
from db.models import (
    User, Role, Permission, UserRole, Session, Budget, Category,
    Template, TemplateItem, Transaction, Goal, GoalFunding,
    LifecycleStage, AuditLog, Notification, PasswordReset, Feedback
)

EXPECTED_TABLES = [
    "Users", "Roles", "Permissions", "User_Roles", "Sessions",
    "budgets", "categories", "templates", "template_items",
    "transactions", "goals", "goal_fundings", "lifecycle_stages",
    "audit_logs", "notifications", "password_resets", "Feedback"
]


@pytest.fixture
def in_memory_engine():
    """Create a fresh in-memory SQLite database with all tables."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


class TestModelRegistration:
    """Verify all 15 tables are registered with SQLAlchemy."""

    def test_all_tables_registered(self):
        registered_tables = Base.metadata.tables.keys()
        for table_name in EXPECTED_TABLES:
            assert table_name in registered_tables, f"Table '{table_name}' not registered"

    def test_table_count(self):
        assert len(Base.metadata.tables) == 17


class TestTableCreation:
    """Verify all tables can be created in a fresh database."""

    def test_create_all_tables(self, in_memory_engine):
        inspector = inspect(in_memory_engine)
        created_tables = inspector.get_table_names()
        for table_name in EXPECTED_TABLES:
            assert table_name in created_tables, f"Table '{table_name}' was not created"


class TestModelColumns:
    """Verify each model's columns match the existing database schema."""

    def _get_column_names(self, model):
        return {column.name for column in model.__table__.columns}

    def test_user_columns(self):
        columns = self._get_column_names(User)
        expected = {"user_id", "name", "email", "password_hash", "mfa_secret", "age", "is_active", "created_on", "updated_on"}
        assert columns == expected

    def test_role_columns(self):
        columns = self._get_column_names(Role)
        expected = {"role_id", "name", "description", "permissions", "created_on", "updated_on"}
        assert columns == expected

    def test_permission_columns(self):
        columns = self._get_column_names(Permission)
        expected = {"permission_id", "name", "description", "created_on", "updated_on"}
        assert columns == expected

    def test_user_role_columns(self):
        columns = self._get_column_names(UserRole)
        expected = {"user_id", "role_id", "updated_on"}
        assert columns == expected

    def test_session_columns(self):
        columns = self._get_column_names(Session)
        expected = {"session_id", "user_id", "issued_on", "expires_on", "ip_address", "user_agent"}
        assert columns == expected

    def test_budget_columns(self):
        columns = self._get_column_names(Budget)
        expected = {"budget_id", "user_id", "period_start", "period_end", "template_id", "created_on", "updated_on"}
        assert columns == expected

    def test_category_columns(self):
        columns = self._get_column_names(Category)
        expected = {"category_id", "user_id", "name", "type", "created_on", "updated_on"}
        assert columns == expected

    def test_template_columns(self):
        columns = self._get_column_names(Template)
        expected = {"template_id", "user_id", "name", "stage_id", "is_default", "created_on", "updated_on"}
        assert columns == expected

    def test_template_item_columns(self):
        columns = self._get_column_names(TemplateItem)
        expected = {"item_id", "template_id", "category_id", "planned_amt", "item_name", "created_on", "updated_on"}
        assert columns == expected

    def test_transaction_columns(self):
        columns = self._get_column_names(Transaction)
        expected = {"txn_id", "budget_id", "category_id", "amount", "occurred_on", "notes", "is_recurring", "recurrence_id"}
        assert columns == expected

    def test_goal_columns(self):
        columns = self._get_column_names(Goal)
        expected = {"goal_id", "user_id", "name", "target_amount", "target_date", "priority", "status", "created_on", "updated_on"}
        assert columns == expected

    def test_goal_funding_columns(self):
        columns = self._get_column_names(GoalFunding)
        expected = {"funding_id", "goal_id", "transaction_id", "amount", "funded_on", "note", "created_on", "updated_on"}
        assert columns == expected

    def test_lifecycle_stage_columns(self):
        columns = self._get_column_names(LifecycleStage)
        expected = {"stage_id", "name", "stage", "display_label", "sort_order", "is_active"}
        assert columns == expected

    def test_audit_log_columns(self):
        columns = self._get_column_names(AuditLog)
        expected = {"audit_id", "actor_user_id", "action", "entity_type", "entity_id", "metadata", "occurred_on"}
        assert columns == expected

    def test_notification_columns(self):
        columns = self._get_column_names(Notification)
        expected = {"notification_id", "user_id", "type", "title", "body", "is_read", "created_on", "read_on"}
        assert columns == expected

    def test_password_reset_columns(self):
        columns = self._get_column_names(PasswordReset)
        expected = {"reset_id", "user_id", "token", "issued_on", "expires_on", "used_on", "ip_address"}
        assert columns == expected

    def test_feedback_columns(self):
        columns = self._get_column_names(Feedback)
        expected = {"feed_id", "submitted_by_user_id", "status", "comments", "assigned_admin_user_id", "created_on", "updated_on"}
        assert columns == expected


class TestForeignKeys:
    """Verify foreign key relationships are correctly defined."""

    def _get_foreign_key_targets(self, model):
        """Return a set of 'table.column' strings for all foreign keys on a model."""
        targets = set()
        for column in model.__table__.columns:
            for foreign_key in column.foreign_keys:
                targets.add(foreign_key.target_fullname)
        return targets

    def test_user_role_foreign_keys(self):
        targets = self._get_foreign_key_targets(UserRole)
        assert "Users.user_id" in targets
        assert "Roles.role_id" in targets

    def test_session_foreign_keys(self):
        targets = self._get_foreign_key_targets(Session)
        assert "Users.user_id" in targets

    def test_budget_foreign_keys(self):
        targets = self._get_foreign_key_targets(Budget)
        assert "Users.user_id" in targets
        assert "templates.template_id" in targets

    def test_category_foreign_keys(self):
        targets = self._get_foreign_key_targets(Category)
        assert "Users.user_id" in targets

    def test_template_foreign_keys(self):
        targets = self._get_foreign_key_targets(Template)
        assert "Users.user_id" in targets
        assert "lifecycle_stages.stage_id" in targets

    def test_template_item_foreign_keys(self):
        targets = self._get_foreign_key_targets(TemplateItem)
        assert "templates.template_id" in targets
        assert "categories.category_id" in targets

    def test_transaction_foreign_keys(self):
        targets = self._get_foreign_key_targets(Transaction)
        assert "budgets.budget_id" in targets
        assert "categories.category_id" in targets

    def test_goal_foreign_keys(self):
        targets = self._get_foreign_key_targets(Goal)
        assert "Users.user_id" in targets

    def test_goal_funding_foreign_keys(self):
        targets = self._get_foreign_key_targets(GoalFunding)
        assert "goals.goal_id" in targets
        assert "transactions.txn_id" in targets

    def test_audit_log_foreign_keys(self):
        targets = self._get_foreign_key_targets(AuditLog)
        assert "Users.user_id" in targets

    def test_notification_foreign_keys(self):
        targets = self._get_foreign_key_targets(Notification)
        assert "Users.user_id" in targets

    def test_password_reset_foreign_keys(self):
        targets = self._get_foreign_key_targets(PasswordReset)
        assert "Users.user_id" in targets

    def test_feedback_foreign_keys(self):
        targets = self._get_foreign_key_targets(Feedback)
        assert "Users.user_id" in targets
