from sqlalchemy import (
    Column, BigInteger, SmallInteger, String, Text, Boolean,
    Date, DateTime, Numeric, ForeignKey
)
from db.database import Base


class User(Base):
    __tablename__ = "Users"

    user_id = Column(BigInteger, primary_key=True)
    name = Column(String(255))
    email = Column(String(320), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    mfa_secret = Column(String(255))
    age = Column(SmallInteger)
    is_active = Column(Boolean, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class Role(Base):
    __tablename__ = "Roles"

    role_id = Column(SmallInteger, primary_key=True)
    name = Column(String(30), nullable=False)
    description = Column(String(255))
    permissions = Column(Text, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class Permission(Base):
    __tablename__ = "Permissions"

    permission_id = Column(Text, primary_key=True)
    name = Column(String(30), nullable=False)
    description = Column(Text)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class UserRole(Base):
    __tablename__ = "User_Roles"

    user_id = Column(BigInteger, ForeignKey("Users.user_id"), primary_key=True)
    role_id = Column(SmallInteger, ForeignKey("Roles.role_id"), primary_key=True)
    updated_on = Column(DateTime, nullable=False)


class Session(Base):
    __tablename__ = "Sessions"

    session_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    issued_on = Column(DateTime, nullable=False)
    expires_on = Column(DateTime, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)


class Budget(Base):
    __tablename__ = "budgets"

    budget_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    template_id = Column(BigInteger, ForeignKey("templates.template_id"))
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    name = Column(String(120), nullable=False)
    type = Column(Text, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class Template(Base):
    __tablename__ = "templates"

    template_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    name = Column(String(120), nullable=False)
    stage_id = Column(SmallInteger, ForeignKey("lifecycle_stages.stage_id"), nullable=False)
    is_default = Column(Boolean, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class TemplateItem(Base):
    __tablename__ = "template_items"

    item_id = Column(BigInteger, primary_key=True)
    template_id = Column(BigInteger, ForeignKey("templates.template_id"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.category_id"), nullable=False)
    planned_amt = Column(Numeric(12, 2), nullable=False)
    item_name = Column(Text)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    txn_id = Column(BigInteger, primary_key=True)
    budget_id = Column(BigInteger, ForeignKey("budgets.budget_id"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.category_id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    occurred_on = Column(DateTime, nullable=False)
    notes = Column(Text)
    is_recurring = Column(Boolean, nullable=False)
    recurrence_id = Column(BigInteger)


class Goal(Base):
    __tablename__ = "goals"

    goal_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    name = Column(String(120), nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    target_date = Column(Date)
    priority = Column(SmallInteger)
    status = Column(Text, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class GoalFunding(Base):
    __tablename__ = "goal_fundings"

    funding_id = Column(BigInteger, primary_key=True)
    goal_id = Column(BigInteger, ForeignKey("goals.goal_id"), nullable=False)
    transaction_id = Column(BigInteger, ForeignKey("transactions.txn_id"))
    amount = Column(Numeric(12, 2), nullable=False)
    funded_on = Column(Date, nullable=False)
    note = Column(String(255))
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)


class LifecycleStage(Base):
    __tablename__ = "lifecycle_stages"

    stage_id = Column(SmallInteger, primary_key=True)
    name = Column(String(40), nullable=False)
    stage = Column(Text, nullable=False)
    display_label = Column(String(100), nullable=False)
    sort_order = Column(SmallInteger, nullable=False)
    is_active = Column(Boolean, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(BigInteger, primary_key=True)
    actor_user_id = Column(BigInteger, ForeignKey("Users.user_id"))
    action = Column(String(120), nullable=False)
    entity_type = Column(String(120), nullable=False)
    entity_id = Column(BigInteger)
    audit_metadata = Column("metadata", Text)
    occurred_on = Column(DateTime, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    type = Column(Text, nullable=False)
    title = Column(String(120), nullable=False)
    body = Column(Text)
    is_read = Column(Boolean, nullable=False)
    created_on = Column(DateTime, nullable=False)
    read_on = Column(DateTime)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    reset_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("Users.user_id"), nullable=False)
    token = Column(String(120), nullable=False)
    issued_on = Column(DateTime, nullable=False)
    expires_on = Column(DateTime, nullable=False)
    used_on = Column(DateTime)
    ip_address = Column(String(45))


class Feedback(Base):
    __tablename__ = "Feedback"

    feed_id = Column(BigInteger, primary_key=True)
    submitted_by_user_id = Column(BigInteger, ForeignKey("Users.user_id"))
    status = Column(Text, nullable=False)
    comments = Column(Text)
    assigned_admin_user_id = Column(BigInteger, ForeignKey("Users.user_id"))
    created_on = Column(DateTime, nullable=False)
    updated_on = Column(DateTime, nullable=False)
