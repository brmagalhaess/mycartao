from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.card import CardCreate, CardResponse, CardUpdate
from app.services import analytics as analytics_service
from app.services import cards as cards_service

router = APIRouter()
public_router = APIRouter()


@router.get("", response_model=List[CardResponse])
def list_cards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return cards_service.list_cards(db, user)


@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    body: CardCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cards_service.create_card(db, user, body)


@router.get("/{card_id}", response_model=CardResponse)
def get_card(
    card_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cards_service.get_card_for_user(db, user, card_id)


@router.patch("/{card_id}", response_model=CardResponse)
def patch_card(
    card_id: UUID,
    body: CardUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cards_service.update_card(db, user, card_id, body)


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cards_service.delete_card(db, user, card_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.get("/{slug_or_id}", response_model=CardResponse)
def get_public_card(
    slug_or_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    card = cards_service.get_public_card(db, slug_or_id)
    analytics_service.record_view(db, card, request)
    return card
