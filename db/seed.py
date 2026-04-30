"""Seed the database with initial data: admin user, test user, roles, and lifecycle stages.

Safe to run multiple times — skips records that already exist.

Usage:
    python -m db.seed
"""
import hashlib
from datetime import datetime, timezone

from db.database import engine, SessionLocal, Base
import db.models  # registers all ORM models with Base.metadata
from db.models import User, Role, UserRole, LifecycleStage


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        timestamp = datetime.now(timezone.utc)

        # --- Lifecycle Stages ---
        stages = [
            {"stage_id": 1, "name": "young adult", "stage": "young_adult",
             "display_label": "Young Adult (18-30)", "sort_order": 1, "is_active": True},
            {"stage_id": 2, "name": "career", "stage": "career",
             "display_label": "Career (30-55)", "sort_order": 2, "is_active": True},
            {"stage_id": 3, "name": "retirement", "stage": "retirement",
             "display_label": "Retirement (55+)", "sort_order": 3, "is_active": True},
        ]
        for stage_data in stages:
            exists = session.query(LifecycleStage).filter_by(stage_id=stage_data["stage_id"]).first()
            if not exists:
                session.add(LifecycleStage(**stage_data))
                print(f"  Added lifecycle stage: {stage_data['name']}")
        session.commit()

        # --- Roles ---
        roles = [
            {"role_id": 1, "name": "admin", "description": "Full system access", "permissions": "all",
             "created_on": timestamp, "updated_on": timestamp},
            {"role_id": 2, "name": "user", "description": "Standard user access", "permissions": "read,write",
             "created_on": timestamp, "updated_on": timestamp},
        ]
        for role_data in roles:
            exists = session.query(Role).filter_by(role_id=role_data["role_id"]).first()
            if not exists:
                session.add(Role(**role_data))
                print(f"  Added role: {role_data['name']}")
        session.commit()

        # --- Users ---
        users = [
            {
                "name": "Admin User",
                "email": "admin@calcura.com",
                "password_hash": hash_password("admin123"),
                "is_active": True,
                "created_on": timestamp,
                "updated_on": timestamp,
            },
            {
                "name": "Test User",
                "email": "test@calcura.com",
                "password_hash": hash_password("test123"),
                "is_active": True,
                "created_on": timestamp,
                "updated_on": timestamp,
            },
        ]
        # Track which users were just created so we can assign roles
        created_users = []
        for user_data in users:
            exists = session.query(User).filter_by(email=user_data["email"]).first()
            if not exists:
                new_user = User(**user_data)
                session.add(new_user)
                session.commit()  # commit each user so the next query sees a clean state
                session.refresh(new_user)  # reload to get auto-generated user_id
                created_users.append(new_user)
                print(f"  Added user: {user_data['email']}")

        # --- Assign roles to new users ---
        # admin@calcura.com gets admin role, test@calcura.com gets user role
        role_assignments = {
            "admin@calcura.com": 1,  # admin role
            "test@calcura.com": 2,   # user role
        }
        for user in created_users:
            target_role_id = role_assignments.get(user.email)
            if target_role_id:
                exists = session.query(UserRole).filter_by(
                    user_id=user.user_id, role_id=target_role_id
                ).first()
                if not exists:
                    session.add(UserRole(
                        user_id=user.user_id,
                        role_id=target_role_id,
                        updated_on=timestamp,
                    ))
                    print(f"  Assigned role {target_role_id} to {user.email}")
        session.commit()

        print("Seed complete.")

    except Exception as error:
        session.rollback()
        print(f"Seed failed: {error}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
