#lines 1 - 103 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from db.models import Category

router = APIRouter(prefix="/categories", tags=["Categories"])

VALID_CATEGORY_TYPES = {
    "income",
    "expenses",
    "savings",
    "investments",
    "debt",
    "retirement"
}


class CategoryCreate(BaseModel):
    user_id: int
    name: str
    type: str

    @field_validator("type")
    def validate_type(cls, value):
        if value not in VALID_CATEGORY_TYPES:
            raise ValueError("Type must be one of the following: income, expenses, savings, investments, debt, retirement")
        return value


class CategoryUpdate(BaseModel):
    name: str | None = None
    type: str | None = None

    @field_validator("type")
    def validate_type(cls, value):
        if value is not None and value not in VALID_CATEGORY_TYPES:
            raise ValueError("Type must be one of the following: income, expenses, savings, investments, debt, retirement")
        return value


@router.get("/")
def list_categories(session: Session = Depends(get_db)):
    categories = session.query(Category).all()
    return [
        {
            "category_id": category.category_id,
            "user_id": category.user_id,
            "name": category.name,
            "type": category.type,
            "created_on": str(category.created_on),
            "updated_on": str(category.updated_on),
        }
        for category in categories
    ]


@router.post("/")
def create_category(category_data: CategoryCreate, session: Session = Depends(get_db)):
    timestamp = datetime.utcnow()
    new_category = Category(
        user_id=category_data.user_id,
        name=category_data.name,
        type=category_data.type,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_category)
    session.commit()
    return {"message": f"Category '{category_data.name}' created under '{category_data.type}'"}


@router.get("/{category_id}")
def get_category(category_id: int, session: Session = Depends(get_db)):
    category = session.query(Category).filter(Category.category_id == category_id).first()
    if not category:
        raise HTTPException(404, "Category not found")
    return {
        "category_id": category.category_id,
        "user_id": category.user_id,
        "name": category.name,
        "type": category.type,
        "created_on": str(category.created_on),
        "updated_on": str(category.updated_on),
    }


@router.put("/{category_id}")
def update_category(category_id: int, update: CategoryUpdate, session: Session = Depends(get_db)):
    category = session.query(Category).filter(Category.category_id == category_id).first()
    if not category:
        raise HTTPException(404, "Category not found")

    if update.name is not None:
        category.name = update.name
    if update.type is not None:
        category.type = update.type

    category.updated_on = datetime.utcnow()
    session.commit()

    new_name = category.name
    new_type = category.type
    return {"message": f"Category updated to '{new_name}' ({new_type})"}


@router.delete("/{category_id}")
def delete_category(category_id: int, session: Session = Depends(get_db)):
    category = session.query(Category).filter(Category.category_id == category_id).first()
    if not category:
        raise HTTPException(404, "Category not found")

    session.delete(category)
    session.commit()
    return {"message": "Category deleted"}
