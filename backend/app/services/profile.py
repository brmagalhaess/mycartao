from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileUpdate

SLUG_RE = re.compile(r"^[a-z0-9-]{3,32}$")
PRO_PLANS = frozenset({"pro", "admin"})


def get_profile_for_user(db: Session, user: User) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
    if profile is None:
        raise AppError("Perfil não encontrado", "not_found", status_code=404)
    return profile


def update_profile(db: Session, user: User, data: ProfileUpdate) -> Profile:
    profile = get_profile_for_user(db, user)
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def set_slug(db: Session, user: User, slug: str) -> Profile:
    if user.plan not in PRO_PLANS:
        raise AppError(
            "Slug personalizado requer plano Pro",
            "plan_required",
            status_code=403,
        )

    normalized = (slug or "").strip().lower()
    if not SLUG_RE.fullmatch(normalized):
        raise AppError(
            "Slug inválido. Use 3–32 caracteres: a-z, 0-9 e hífen.",
            "invalid_slug",
            status_code=400,
        )

    taken = (
        db.query(Profile)
        .filter(Profile.slug == normalized, Profile.user_id != user.id)
        .one_or_none()
    )
    if taken is not None:
        raise AppError("Slug já está em uso", "invalid_slug", status_code=400)

    profile = get_profile_for_user(db, user)
    profile.slug = normalized
    db.commit()
    db.refresh(profile)
    return profile
