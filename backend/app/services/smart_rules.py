from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.models.card import Card
from app.models.profile import Profile
from app.models.smart_rule import SmartRule
from app.models.user import User
from app.schemas.smart_rule import SmartRuleCreate, SmartRuleUpdate
from app.services.entitlements import is_pro
from app.services.profile import get_profile_for_user

VALID_TARGETS = frozenset({"card", "portfolio", "whatsapp"})


def _require_pro(user: User) -> None:
    if not is_pro(user.plan):
        raise AppError(
            "Smart rules requerem plano Pro",
            "plan_required",
            status_code=403,
        )


def list_rules(db: Session, user: User) -> List[SmartRule]:
    _require_pro(user)
    profile = get_profile_for_user(db, user)
    return (
        db.query(SmartRule)
        .filter(SmartRule.profile_id == profile.id)
        .order_by(SmartRule.created_at.asc())
        .all()
    )


def create_rule(db: Session, user: User, data: SmartRuleCreate) -> SmartRule:
    _require_pro(user)
    profile = get_profile_for_user(db, user)
    rule = SmartRule(
        profile_id=profile.id,
        conditions=data.conditions or {},
        target=data.target,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def get_rule_for_user(db: Session, user: User, rule_id: UUID) -> SmartRule:
    _require_pro(user)
    profile = get_profile_for_user(db, user)
    rule = (
        db.query(SmartRule)
        .filter(SmartRule.id == rule_id, SmartRule.profile_id == profile.id)
        .one_or_none()
    )
    if rule is None:
        raise AppError("Smart rule não encontrada", "not_found", status_code=404)
    return rule


def update_rule(
    db: Session, user: User, rule_id: UUID, data: SmartRuleUpdate
) -> SmartRule:
    rule = get_rule_for_user(db, user, rule_id)
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule


def delete_rule(db: Session, user: User, rule_id: UUID) -> None:
    rule = get_rule_for_user(db, user, rule_id)
    db.delete(rule)
    db.commit()


def resolve_go(db: Session, slug_or_id: str) -> Dict[str, str]:
    profile = _resolve_profile(db, slug_or_id)
    if profile is None:
        raise AppError("Destino não encontrado", "not_found", status_code=404)

    rules = (
        db.query(SmartRule)
        .filter(SmartRule.profile_id == profile.id)
        .order_by(SmartRule.created_at.asc())
        .all()
    )
    now = datetime.now()
    target = "card"
    for rule in rules:
        if _matches(rule.conditions or {}, now):
            if rule.target in VALID_TARGETS:
                target = rule.target
            break

    url = _url_for_target(db, profile, target)
    return {"target": target, "url": url}


def _matches(conditions: Dict[str, Any], now: datetime) -> bool:
    if conditions.get("always") is True:
        return True

    hour_range = conditions.get("hour_range")
    if (
        isinstance(hour_range, (list, tuple))
        and len(hour_range) == 2
        and all(isinstance(x, int) for x in hour_range)
    ):
        start, end = hour_range
        hour = now.hour
        if start <= end:
            return start <= hour <= end
        # overnight range e.g. [22, 6]
        return hour >= start or hour <= end

    return False


def _url_for_target(db: Session, profile: Profile, target: str) -> str:
    base = settings.public_app_url.rstrip("/")
    key = profile.slug or str(profile.id)

    if target == "portfolio":
        return f"{base}/p/{key}"

    if target == "whatsapp":
        phone = _whatsapp_digits(db, profile)
        if phone:
            return f"https://wa.me/{phone}"
        # fallback when no WhatsApp number on primary card
        return f"{base}/c/{key}"

    # card (default)
    return f"{base}/c/{key}"


def _whatsapp_digits(db: Session, profile: Profile) -> Optional[str]:
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
        return None

    fields = card.fields or {}
    raw = fields.get("whatsapp") or fields.get("phone") or ""
    digits = re.sub(r"\D+", "", str(raw))
    return digits or None


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

    card = db.query(Card).filter(Card.id == uid).one_or_none()
    if card is None:
        return None
    return db.query(Profile).filter(Profile.id == card.profile_id).one_or_none()
