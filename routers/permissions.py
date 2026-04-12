#Lines 1 - 41 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import Permission

router = APIRouter(prefix="/permissions", tags=["Permissions"])


class PermissionCreate(BaseModel):
    permission_id: str
    name: str
    description: str | None = None


class PermissionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get("/")
def list_permissions(session: Session = Depends(get_db)):
    permissions = session.query(Permission).all()
    return [
        {
            "permission_id": perm.permission_id,
            "name": perm.name,
            "description": perm.description,
            "created_on": str(perm.created_on),
            "updated_on": str(perm.updated_on),
        }
        for perm in permissions
    ]


@router.post("/")
def create_permission(perm_data: PermissionCreate, session: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc)
    new_permission = Permission(
        permission_id=perm_data.permission_id,
        name=perm_data.name,
        description=perm_data.description,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_permission)
    session.commit()
    return {"message": "Permission created"}
