#lines 1 - 86 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone

from db.database import get_db
from db.models import Budget

router = APIRouter(prefix="/budgets", tags=["Budgets"])


class BudgetCreate(BaseModel):
    user_id: int
    # date type auto-parses "YYYY-MM-DD" strings from JSON into date objects
    period_start: date
    period_end: date
    template_id: int | None = None


class BudgetUpdate(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    template_id: int | None = None


@router.get("/")
def list_budgets(session: Session = Depends(get_db)):
    budgets = session.query(Budget).all()
    return [
        {
            "budget_id": budget.budget_id,
            "user_id": budget.user_id,
            "period_start": str(budget.period_start),
            "period_end": str(budget.period_end),
            "template_id": budget.template_id,
            "created_on": str(budget.created_on),
            "updated_on": str(budget.updated_on),
        }
        for budget in budgets
    ]


@router.post("/")
def create_budget(budget_data: BudgetCreate, session: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc)
    new_budget = Budget(
        user_id=budget_data.user_id,
        period_start=budget_data.period_start,
        period_end=budget_data.period_end,
        template_id=budget_data.template_id,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_budget)
    session.commit()
    return {"message": "Budget created"}


@router.get("/{budget_id}")
def get_budget(budget_id: int, session: Session = Depends(get_db)):
    budget = session.query(Budget).filter(Budget.budget_id == budget_id).first()
    if not budget:
        raise HTTPException(404, "Budget not found")
    return {
        "budget_id": budget.budget_id,
        "user_id": budget.user_id,
        "period_start": str(budget.period_start),
        "period_end": str(budget.period_end),
        "template_id": budget.template_id,
        "created_on": str(budget.created_on),
        "updated_on": str(budget.updated_on),
    }


@router.put("/{budget_id}")
def update_budget(budget_id: int, update: BudgetUpdate, session: Session = Depends(get_db)):
    budget = session.query(Budget).filter(Budget.budget_id == budget_id).first()
    if not budget:
        raise HTTPException(404, "Budget not found")

    if update.period_start is not None:
        budget.period_start = update.period_start
    if update.period_end is not None:
        budget.period_end = update.period_end
    if update.template_id is not None:
        budget.template_id = update.template_id

    budget.updated_on = datetime.now(timezone.utc)
    session.commit()
    return {"message": "Budget updated"}


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, session: Session = Depends(get_db)):
    budget = session.query(Budget).filter(Budget.budget_id == budget_id).first()
    if not budget:
        raise HTTPException(404, "Budget not found")

    session.delete(budget)
    session.commit()
    return {"message": "Budget deleted"}
