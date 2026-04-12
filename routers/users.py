#Lines 1 - 45 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import hashlib

from db.database import get_db
from db.models import User

router = APIRouter(prefix="/users", tags=["Users"])


# --- Pydantic Models ---

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Helper Functions ---

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# --- Endpoints ---

@router.get("/")
def list_users(session: Session = Depends(get_db)):
    users = session.query(User).all()
    return [
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "password_hash": user.password_hash,
            "mfa_secret": user.mfa_secret,
            "age": user.age,
            "is_active": user.is_active,
            "created_on": str(user.created_on),
            "updated_on": str(user.updated_on),
        }
        for user in users
    ]


@router.post("/")
def create_user(user: UserCreate, session: Session = Depends(get_db)):
    existing = session.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    timestamp = datetime.now(timezone.utc)
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        age=user.age,
        is_active=True,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {"Message": "User created successfully", "user_id": new_user.user_id}


@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_db)):
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user)
    session.commit()

    return {"message": "User deleted successfully"}


@router.put("/{user_id}")
def update_user(user_id: int, user: UserUpdate, session: Session = Depends(get_db)):
    if user.name is None and user.email is None:
        raise HTTPException(status_code=400, detail="No updatable fields provided")

    existing_user = session.query(User).filter(User.user_id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email is not None:
        email_taken = (
            session.query(User)
            .filter(User.email == user.email, User.user_id != user_id)
            .first()
        )
        if email_taken:
            raise HTTPException(status_code=409, detail="Email already in use")

    if user.name is not None:
        existing_user.name = user.name
    if user.email is not None:
        existing_user.email = user.email

    existing_user.updated_on = datetime.now(timezone.utc)
    session.commit()

    return {"message": "User updated successfully", "user_id": user_id}


@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_db)):
    user = session.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    incoming_hash = hash_password(data.password)
    if incoming_hash != user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "user_id": user.user_id,
        "name": user.name or "",
        "email": user.email,
    }
