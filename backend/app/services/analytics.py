from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models.analytics import CardView
from app.models.card import Card
from app.models.user import User
from app.services.profile import get_profile_for_user

PRO_PLANS = frozenset({"pro", "admin"})
FREE_MAX_DAYS = 7
PRO_MAX_DAYS = 90


def clamp_days(plan: str, days: int) -> int:
    if days < 1:
        days = 1
    max_days = PRO_MAX_DAYS if plan in PRO_PLANS else FREE_MAX_DAYS
    return min(days, max_days)


def hash_ip(ip: Optional[str]) -> Optional[str]:
    if not ip:
        return None
    raw = f"{ip}{settings.jwt_secret}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip() or None
    if request.client:
        return request.client.host
    return None


def record_view(db: Session, card: Card, request: Request) -> CardView:
    view = CardView(
        card_id=card.id,
        ip_hash=hash_ip(_client_ip(request)),
        ua=request.headers.get("user-agent"),
        referrer=request.headers.get("referer") or request.headers.get("referrer"),
    )
    db.add(view)
    db.commit()
    db.refresh(view)
    return view


def summary(db: Session, user: User, days: int) -> Dict[str, Any]:
    days = clamp_days(user.plan, days)
    profile = get_profile_for_user(db, user)
    card_ids = [
        row.id
        for row in db.query(Card.id).filter(Card.profile_id == profile.id).all()
    ]
    if not card_ids:
        return {"views": 0, "unique_approx": 0, "by_day": []}

    since = datetime.now(timezone.utc) - timedelta(days=days)
    base = db.query(CardView).filter(
        CardView.card_id.in_(card_ids),
        CardView.viewed_at >= since,
    )
    views = base.count()
    unique_approx = (
        db.query(func.count(func.distinct(CardView.ip_hash)))
        .filter(
            CardView.card_id.in_(card_ids),
            CardView.viewed_at >= since,
            CardView.ip_hash.isnot(None),
        )
        .scalar()
        or 0
    )

    day_col = func.date(CardView.viewed_at)
    rows = (
        db.query(day_col.label("day"), func.count().label("views"))
        .filter(
            CardView.card_id.in_(card_ids),
            CardView.viewed_at >= since,
        )
        .group_by(day_col)
        .order_by(day_col.asc())
        .all()
    )
    by_day: List[Dict[str, Any]] = [
        {"day": str(row.day), "views": int(row.views)} for row in rows
    ]
    return {"views": views, "unique_approx": int(unique_approx), "by_day": by_day}
