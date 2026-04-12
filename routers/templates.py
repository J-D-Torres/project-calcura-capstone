#lines 1 - 104 written by Emma Wikingstad
#Rewritten to use SQLAlchemy ORM by Jonathan Torres
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from db.models import Template

router = APIRouter(prefix="/templates", tags=["Templates"])

VALID_STAGES = {
    1: "young adult",
    2: "career",
    3: "retirement"
}


class TemplateCreate(BaseModel):
    user_id: int
    name: str
    stage_id: int
    is_default: bool = False

    @field_validator("stage_id")
    def validate_stage(cls, value):
        if value not in VALID_STAGES:
            raise ValueError("stage_id must be 1 (young adult), 2 (career), or 3 (retirement)")
        return value


class TemplateUpdate(BaseModel):
    name: str | None = None
    stage_id: int | None = None
    is_default: bool | None = None

    @field_validator("stage_id")
    def validate_stage(cls, value):
        if value is not None and value not in VALID_STAGES:
            raise ValueError("stage_id must be 1 (young adult), 2 (career), or 3 (retirement)")
        return value


@router.get("/")
def list_templates(session: Session = Depends(get_db)):
    templates = session.query(Template).all()
    return [
        {
            "template_id": template.template_id,
            "user_id": template.user_id,
            "name": template.name,
            "stage_id": template.stage_id,
            "is_default": template.is_default,
            "created_on": str(template.created_on),
            "updated_on": str(template.updated_on),
        }
        for template in templates
    ]


@router.post("/")
def create_template(template_data: TemplateCreate, session: Session = Depends(get_db)):
    timestamp = datetime.utcnow()
    new_template = Template(
        user_id=template_data.user_id,
        name=template_data.name,
        stage_id=template_data.stage_id,
        is_default=template_data.is_default,
        created_on=timestamp,
        updated_on=timestamp,
    )
    session.add(new_template)
    session.commit()
    session.refresh(new_template)
    return {"message": f"Template created for stage '{VALID_STAGES[template_data.stage_id]}'", "template_id": new_template.template_id}


@router.get("/{template_id}")
def get_template(template_id: int, session: Session = Depends(get_db)):
    template = session.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(404, "Template not found")
    return {
        "template_id": template.template_id,
        "user_id": template.user_id,
        "name": template.name,
        "stage_id": template.stage_id,
        "is_default": template.is_default,
        "created_on": str(template.created_on),
        "updated_on": str(template.updated_on),
    }


@router.put("/{template_id}")
def update_template(template_id: int, update: TemplateUpdate, session: Session = Depends(get_db)):
    template = session.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(404, "Template not found")

    if update.name is not None:
        template.name = update.name
    if update.stage_id is not None:
        template.stage_id = update.stage_id
    if update.is_default is not None:
        template.is_default = update.is_default

    template.updated_on = datetime.utcnow()
    session.commit()

    current_stage = template.stage_id
    return {"message": f"Template updated (stage: {VALID_STAGES[current_stage]})"}


@router.delete("/{template_id}")
def delete_template(template_id: int, session: Session = Depends(get_db)):
    template = session.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(404, "Template not found")

    session.delete(template)
    session.commit()
    return {"message": "Template deleted"}
