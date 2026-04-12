#lines 1-35 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import UserRole

router = APIRouter(prefix="/user_roles", tags=["User Roles"])


class UserRoleCreate(BaseModel):
    user_id: int
    role_id: int


@router.get("/")
def list_user_roles(session: Session = Depends(get_db)):
    user_roles = session.query(UserRole).all()
    return [
        {
            "user_id": role.user_id,
            "role_id": role.role_id,
            "updated_on": str(role.updated_on),
        }
        for role in user_roles
    ]


@router.post("/")
def assign_role(role_data: UserRoleCreate, session: Session = Depends(get_db)):
    new_role = UserRole(
        user_id=role_data.user_id,
        role_id=role_data.role_id,
        updated_on=datetime.now(timezone.utc),
    )
    session.add(new_role)
    session.commit()
    return {"message": "Role assigned to user"}
