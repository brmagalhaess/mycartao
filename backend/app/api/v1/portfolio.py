from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioResponse, PortfolioUpdate
from app.services import portfolio as portfolio_service

router = APIRouter()
public_router = APIRouter()


@router.get("", response_model=List[PortfolioResponse])
def list_portfolio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return portfolio_service.list_items(db, user)


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    body: PortfolioCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return portfolio_service.create_item(db, user, body)


@router.get("/{item_id}", response_model=PortfolioResponse)
def get_portfolio_item(
    item_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return portfolio_service.get_item_for_user(db, user, item_id)


@router.patch("/{item_id}", response_model=PortfolioResponse)
def patch_portfolio_item(
    item_id: UUID,
    body: PortfolioUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return portfolio_service.update_item(db, user, item_id, body)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    item_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portfolio_service.delete_item(db, user, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.get("/{slug_or_id}", response_model=List[PortfolioResponse])
def get_public_portfolio(slug_or_id: str, db: Session = Depends(get_db)):
    return portfolio_service.get_public_portfolio(db, slug_or_id)
