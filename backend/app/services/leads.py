from __future__ import annotations

import re
from typing import List

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse
from app.services.cards import get_public_card
from app.services.profile import get_profile_for_user

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
VALID_SOURCES = frozenset({"card", "presence"})


def create_public_lead(db: Session, slug_or_id: str, data: LeadCreate) -> LeadResponse:
    card = get_public_card(db, slug_or_id)
    profile = card.profile
    if profile is None:
        raise AppError("Cartão não encontrado", "not_found", status_code=404)

    if not getattr(profile, "lead_capture_enabled", True):
        raise AppError(
            "Captura de contatos desativada",
            "lead_capture_disabled",
            status_code=404,
        )

    name = (data.name or "").strip()
    if len(name) < 1:
        raise AppError("Informe seu nome", "invalid_lead", status_code=400)

    email = (data.email or "").strip() or None
    phone = (data.phone or "").strip() or None
    if not email and not phone:
        raise AppError(
            "Informe e-mail ou telefone",
            "invalid_lead",
            status_code=400,
        )
    if email and not EMAIL_RE.fullmatch(email):
        raise AppError("E-mail inválido", "invalid_lead", status_code=400)

    source = (data.source or "card").strip().lower()
    if source not in VALID_SOURCES:
        source = "card"

    message = (data.message or "").strip() or None
    if message and len(message) > 1000:
        message = message[:1000]

    lead = Lead(
        profile_id=profile.id,
        card_id=card.id,
        name=name,
        email=email,
        phone=phone,
        message=message,
        source=source,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _to_response(lead)


def list_leads(db: Session, user: User) -> List[LeadResponse]:
    profile = get_profile_for_user(db, user)
    rows = (
        db.query(Lead)
        .filter(Lead.profile_id == profile.id)
        .order_by(Lead.created_at.desc())
        .limit(200)
        .all()
    )
    return [_to_response(row) for row in rows]


def delete_lead(db: Session, user: User, lead_id) -> None:
    profile = get_profile_for_user(db, user)
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.profile_id == profile.id)
        .one_or_none()
    )
    if lead is None:
        raise AppError("Lead não encontrado", "not_found", status_code=404)
    db.delete(lead)
    db.commit()


def _to_response(lead: Lead) -> LeadResponse:
    created = lead.created_at.isoformat() if lead.created_at else None
    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        message=lead.message,
        source=lead.source,
        created_at=created,
    )
