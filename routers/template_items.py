#lines 1 - 80 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import TemplateItem

router = APIRouter(prefix="/template_items", tags=["Template Items"])


class TemplateItemCreate(BaseModel):
    template_id: int
    category_id: int
    planned_amt: float
    item_name: str | None = None


class TemplateItemUpdate(BaseModel):
    planned_amt: float | None = None
    item_name: str | None = None


@router.get("/")
def list_template_items(session: Session = Depends(get_db)):
    items = session.query(TemplateItem).all()
    return [
        {
            "item_id": item.item_id,
            "template_id": item.template_id,
            "category_id": item.category_id,
            "planned_amt": float(item.planned_amt),
            "item_name": item.item_name,
            "created_on": str(item.created_on),
            "updated_on": str(item.updated_on),
        }
        for item in items
    ]


@router.post("/")
def create_template_item(item_data: TemplateItemCreate, session: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc)
    new_item = TemplateItem(
        template_id=item_data.template_id,
        category_id=item_data.category_id,
        planned_amt=item_data.planned_amt,
        item_name=item_data.item_name,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    return {"message": "Template item created", "item_id": new_item.item_id}


@router.get("/{item_id}")
def get_template_item(item_id: int, session: Session = Depends(get_db)):
    item = session.query(TemplateItem).filter(TemplateItem.item_id == item_id).first()
    if not item:
        raise HTTPException(404, "Template item not found")
    return {
        "item_id": item.item_id,
        "template_id": item.template_id,
        "category_id": item.category_id,
        "planned_amt": float(item.planned_amt),
        "item_name": item.item_name,
        "created_on": str(item.created_on),
        "updated_on": str(item.updated_on),
    }


@router.put("/{item_id}")
def update_template_item(item_id: int, update: TemplateItemUpdate, session: Session = Depends(get_db)):
    item = session.query(TemplateItem).filter(TemplateItem.item_id == item_id).first()
    if not item:
        raise HTTPException(404, "Template item not found")

    if update.planned_amt is not None:
        item.planned_amt = update.planned_amt
    if update.item_name is not None:
        item.item_name = update.item_name

    item.updated_on = datetime.now(timezone.utc)
    session.commit()
    return {"message": "Template item updated"}


@router.delete("/{item_id}")
def delete_template_item(item_id: int, session: Session = Depends(get_db)):
    item = session.query(TemplateItem).filter(TemplateItem.item_id == item_id).first()
    if not item:
        raise HTTPException(404, "Template item not found")

    session.delete(item)
    session.commit()
    return {"message": "Template item deleted"}
