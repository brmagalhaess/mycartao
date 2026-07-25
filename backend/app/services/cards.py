from __future__ import annotations

import uuid
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.card import Card
from app.models.profile import Profile
from app.models.user import User
from app.schemas.card import CardCreate, CardUpdate, PublicCardResponse
from app.services.custom_links import gate_custom_links
from app.services.profile import get_profile_for_user

FREE_CARD_LIMIT = 1
PRO_PLANS = frozenset({"pro", "admin"})

# fields JSON keys: phone, email, company, whatsapp, website, linkedin, instagram, custom_links


def list_cards(db: Session, user: User) -> List[Card]:
    profile = get_profile_for_user(db, user)
    return (
        db.query(Card)
        .filter(Card.profile_id == profile.id)
        .order_by(Card.created_at.asc())
        .all()
    )


def create_card(db: Session, user: User, data: CardCreate) -> Card:
    profile = get_profile_for_user(db, user)
    if user.plan not in PRO_PLANS:
        count = db.query(Card).filter(Card.profile_id == profile.id).count()
        if count >= FREE_CARD_LIMIT:
            raise AppError(
                "Limite de cartões do plano Free atingido",
                "card_limit_reached",
                status_code=403,
            )

    fields = gate_custom_links(user, data.fields or {}) or {}
    card = Card(
        profile_id=profile.id,
        title=data.title,
        layout=data.layout,
        fields=fields,
        is_primary=data.is_primary,
    )
    if data.is_primary:
        _clear_primary(db, profile.id)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def get_card_for_user(db: Session, user: User, card_id: UUID) -> Card:
    profile = get_profile_for_user(db, user)
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.profile_id == profile.id)
        .one_or_none()
    )
    if card is None:
        raise AppError("Cartão não encontrado", "not_found", status_code=404)
    return card


def update_card(db: Session, user: User, card_id: UUID, data: CardUpdate) -> Card:
    card = get_card_for_user(db, user, card_id)
    payload = data.model_dump(exclude_unset=True)
    if "fields" in payload:
        fields = gate_custom_links(user, payload["fields"]) or {}
        # Free replace-all must not wipe Pro-era custom_links (cannot clear/modify here).
        if user.plan not in PRO_PLANS:
            existing_links = (card.fields or {}).get("custom_links")
            if existing_links:
                fields = {**fields, "custom_links": existing_links}
        payload["fields"] = fields
    if payload.get("is_primary") is True:
        _clear_primary(db, card.profile_id)
    for key, value in payload.items():
        setattr(card, key, value)
    db.commit()
    db.refresh(card)
    return card


def delete_card(db: Session, user: User, card_id: UUID) -> None:
    card = get_card_for_user(db, user, card_id)
    db.delete(card)
    db.commit()


def get_public_card(db: Session, slug_or_id: str) -> Card:
    card = _by_uuid(db, slug_or_id)
    if card is not None:
        return card

    profile = db.query(Profile).filter(Profile.slug == slug_or_id).one_or_none()
    if profile is None:
        # Allow the same public key as portfolio/smart (profile UUID).
        try:
            profile = (
                db.query(Profile)
                .filter(Profile.id == UUID(slug_or_id))
                .one_or_none()
            )
        except ValueError:
            profile = None
    if profile is None:
        raise AppError("Cartão não encontrado", "not_found", status_code=404)

    card = (
        db.query(Card)
        .filter(Card.profile_id == profile.id, Card.is_primary.is_(True))
        .one_or_none()
    )
    if card is None:
        card = (
            db.query(Card)
            .filter(Card.profile_id == profile.id)
            .order_by(Card.created_at.asc())
            .first()
        )
    if card is None:
        raise AppError("Cartão não encontrado", "not_found", status_code=404)
    return card


def to_public_card_response(card: Card) -> PublicCardResponse:
    profile = card.profile
    owner = profile.user if profile is not None else None
    plan = owner.plan if owner is not None else "free"
    brand = profile.brand_color if profile and plan in PRO_PLANS else None
    return PublicCardResponse(
        id=card.id,
        title=card.title,
        layout=card.layout,
        fields=card.fields or {},
        is_primary=card.is_primary,
        display_name=profile.display_name if profile else None,
        headline=profile.headline if profile else None,
        bio=profile.bio if profile else None,
        theme=(profile.theme if profile else None) or "minimal",
        brand_color=brand,
        show_mycartao_branding=plan not in PRO_PLANS,
    )


def _by_uuid(db: Session, slug_or_id: str) -> Optional[Card]:
    try:
        card_id = UUID(slug_or_id)
    except ValueError:
        return None
    return db.query(Card).filter(Card.id == card_id).one_or_none()


def _clear_primary(db: Session, profile_id: uuid.UUID) -> None:
    db.query(Card).filter(Card.profile_id == profile_id, Card.is_primary.is_(True)).update(
        {"is_primary": False}
    )
