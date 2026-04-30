from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Goal

router = APIRouter(prefix="/goals", tags=["Goals"])


class GoalCreate(BaseModel):
    user_id: int
    name: str
    target_amount: Decimal
    target_date: date | None = None
    apr: Decimal | None = None
    down_payment: Decimal | None = None
    interest: Decimal | None = None
    goal_type: str | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: Decimal | None = None
    target_date: date | None = None
    priority: int | None = None
    status: str | None = None
    apr: Decimal | None = None
    down_payment: Decimal | None = None
    interest: Decimal | None = None
    goal_type: str | None = None


def _serialize(goal: Goal) -> dict:
    return {
        "goal_id": goal.goal_id,
        "user_id": goal.user_id,
        "name": goal.name,
        "target_amount": float(goal.target_amount) if goal.target_amount is not None else None,
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "priority": goal.priority,
        "status": goal.status,
        "apr": float(goal.apr) if goal.apr is not None else None,
        "down_payment": float(goal.down_payment) if goal.down_payment is not None else None,
        "interest": float(goal.interest) if goal.interest is not None else None,
        "goal_type": goal.goal_type,
        "created_on": str(goal.created_on),
        "updated_on": str(goal.updated_on),
    }


@router.get("/")
def list_goals(session: Session = Depends(get_db)):
    return [_serialize(goal) for goal in session.query(Goal).all()]


@router.get("/{goal_id}")
def get_goal(goal_id: int, session: Session = Depends(get_db)):
    goal = session.query(Goal).filter(Goal.goal_id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _serialize(goal)


@router.post("/")
def create_goal(payload: GoalCreate, session: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc)
    goal = Goal(
        user_id=payload.user_id,
        name=payload.name,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
        apr=payload.apr,
        down_payment=payload.down_payment,
        interest=payload.interest,
        goal_type=payload.goal_type,
        priority=None,
        status="active",
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return {"message": "Goal created", "goal_id": goal.goal_id}


@router.put("/{goal_id}")
def update_goal(goal_id: int, update: GoalUpdate, session: Session = Depends(get_db)):
    goal = session.query(Goal).filter(Goal.goal_id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field in ("name", "target_amount", "target_date", "priority", "status",
                  "apr", "down_payment", "interest", "goal_type"):
        value = getattr(update, field)
        if value is not None:
            setattr(goal, field, value)

    goal.updated_on = datetime.now(timezone.utc)
    session.commit()
    return {"message": "Goal updated"}


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, session: Session = Depends(get_db)):
    goal = session.query(Goal).filter(Goal.goal_id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    session.delete(goal)
    session.commit()
    return {"message": "Goal deleted"}
