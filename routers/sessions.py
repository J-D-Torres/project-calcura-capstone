#lines 1 - 55 written by emma wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session as DbSession
from datetime import datetime
import hashlib

from db.database import get_db
from db.models import Session as SessionModel, User

router = APIRouter(prefix="/sessions", tags=["Sessions"])


class SessionCreate(BaseModel):
    user_id: int
    expires_on: str
    ip_address: str | None = None
    user_agent: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


@router.get("/")
def list_sessions(session: DbSession = Depends(get_db)):
    sessions = session.query(SessionModel).all()
    return [
        {
            "session_id": row.session_id,
            "user_id": row.user_id,
            "issued_on": str(row.issued_on),
            "expires_on": str(row.expires_on),
            "ip_address": row.ip_address,
            "user_agent": row.user_agent,
        }
        for row in sessions
    ]


@router.post("/")
def create_session(session_data: SessionCreate, session: DbSession = Depends(get_db)):
    new_session = SessionModel(
        user_id=session_data.user_id,
        issued_on=datetime.utcnow(),
        expires_on=session_data.expires_on,
        ip_address=session_data.ip_address,
        user_agent=session_data.user_agent,
    )
    session.add(new_session)
    session.commit()
    return {"message": "Session created"}


@router.get("/{session_id}")
def get_session(session_id: int, session: DbSession = Depends(get_db)):
    row = session.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not row:
        raise HTTPException(404, "Session not found")
    return {
        "session_id": row.session_id,
        "user_id": row.user_id,
        "issued_on": str(row.issued_on),
        "expires_on": str(row.expires_on),
        "ip_address": row.ip_address,
        "user_agent": row.user_agent,
    }


@router.delete("/{session_id}")
def delete_session(session_id: int, session: DbSession = Depends(get_db)):
    row = session.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not row:
        raise HTTPException(404, "Session not found")

    session.delete(row)
    session.commit()
    return {"message": "Session deleted"}


@router.post("/login")
def login(data: LoginRequest, session: DbSession = Depends(get_db)):
    user = session.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_hash = hashlib.sha256(data.password.encode()).hexdigest()
    if password_hash != user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    new_session = SessionModel(
        user_id=user.user_id,
        issued_on=datetime.utcnow(),
        expires_on="2099-12-31 23:59:59",
        ip_address=None,
        user_agent=None,
    )
    session.add(new_session)
    session.commit()
    session.refresh(new_session)

    return {
        "message": "Login successful",
        "session_id": new_session.session_id,
        "user_id": user.user_id,
    }
