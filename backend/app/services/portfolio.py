from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.card import Card
from app.models.portfolio import PortfolioItem
from app.models.profile import Profile
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate
from app.services.profile import get_profile_for_user

FREE_PORTFOLIO_LIMIT = 3
PRO_PLANS = frozenset({"pro", "admin"})


def list_items(db: Session, user: User) -> List[PortfolioItem]:
    profile = get_profile_for_user(db, user)
    return (
        db.query(PortfolioItem)
        .filter(PortfolioItem.profile_id == profile.id)
        .order_by(PortfolioItem.sort_order.asc(), PortfolioItem.created_at.asc())
        .all()
    )


def create_item(db: Session, user: User, data: PortfolioCreate) -> PortfolioItem:
    profile = get_profile_for_user(db, user)
    if user.plan not in PRO_PLANS:
        count = (
            db.query(PortfolioItem)
            .filter(PortfolioItem.profile_id == profile.id)
            .count()
        )
        if count >= FREE_PORTFOLIO_LIMIT:
            raise AppError(
                "Limite de itens de portfólio do plano Free atingido",
                "portfolio_limit_reached",
                status_code=403,
            )

    item = PortfolioItem(
        profile_id=profile.id,
        type=data.type,
        title=data.title,
        description=data.description,
        price=data.price,
        image_key=data.image_key,
        sort_order=data.sort_order,
        category=data.category,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item_for_user(db: Session, user: User, item_id: UUID) -> PortfolioItem:
    profile = get_profile_for_user(db, user)
    item = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.id == item_id, PortfolioItem.profile_id == profile.id)
        .one_or_none()
    )
    if item is None:
        raise AppError("Item de portfólio não encontrado", "not_found", status_code=404)
    return item


def update_item(
    db: Session, user: User, item_id: UUID, data: PortfolioUpdate
) -> PortfolioItem:
    item = get_item_for_user(db, user, item_id)
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, user: User, item_id: UUID) -> None:
    item = get_item_for_user(db, user, item_id)
    db.delete(item)
    db.commit()


def get_public_portfolio(db: Session, slug_or_id: str) -> List[PortfolioItem]:
    profile = _resolve_profile(db, slug_or_id)
    if profile is None:
        raise AppError("Portfólio não encontrado", "not_found", status_code=404)

    return (
        db.query(PortfolioItem)
        .filter(PortfolioItem.profile_id == profile.id)
        .order_by(PortfolioItem.sort_order.asc(), PortfolioItem.created_at.asc())
        .all()
    )


def _resolve_profile(db: Session, slug_or_id: str) -> Optional[Profile]:
    profile = db.query(Profile).filter(Profile.slug == slug_or_id).one_or_none()
    if profile is not None:
        return profile

    try:
        uid = UUID(slug_or_id)
    except ValueError:
        return None

    profile = db.query(Profile).filter(Profile.id == uid).one_or_none()
    if profile is not None:
        return profile

    # Same public key as /c/{cardId} — one link for all tools.
    card = db.query(Card).filter(Card.id == uid).one_or_none()
    if card is not None:
        return db.query(Profile).filter(Profile.id == card.profile_id).one_or_none()

    item = db.query(PortfolioItem).filter(PortfolioItem.id == uid).one_or_none()
    if item is None:
        return None
    return db.query(Profile).filter(Profile.id == item.profile_id).one_or_none()
