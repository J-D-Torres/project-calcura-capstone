#lines 1-40 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import Role

router = APIRouter(prefix="/roles", tags=["Roles"])


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permissions: str | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: str | None = None


@router.get("/")
def list_roles(session: Session = Depends(get_db)):
    roles = session.query(Role).all()
    return [
        {
            "role_id": role.role_id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions,
            "created_on": str(role.created_on),
            "updated_on": str(role.updated_on),
        }
        for role in roles
    ]


@router.post("/")
def create_role(role_data: RoleCreate, session: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc)
    new_role = Role(
        name=role_data.name,
        description=role_data.description,
        permissions=role_data.permissions,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_role)
    session.commit()
    return {"Message": "Role created successfully"}
