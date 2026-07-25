from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse
from app.services import leads as leads_service

router = APIRouter()
public_router = APIRouter()


@router.get("", response_model=List[LeadResponse])
def list_leads(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return leads_service.list_leads(db, user)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leads_service.delete_lead(db, user, lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.post(
    "/{slug_or_id}/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_public_lead(
    slug_or_id: str,
    body: LeadCreate,
    db: Session = Depends(get_db),
):
    return leads_service.create_public_lead(db, slug_or_id, body)
