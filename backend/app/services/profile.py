from __future__ import annotations

import re

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileUpdate

SLUG_RE = re.compile(r"^[a-z0-9-]{3,32}$")
PRO_PLANS = frozenset({"pro", "admin"})
FREE_THEMES = frozenset({"minimal", "classic", "bold"})
PRO_THEMES = frozenset({"minimal", "classic", "bold", "sand", "ink"})
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def get_profile_for_user(db: Session, user: User) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
    if profile is None:
        raise AppError("Perfil não encontrado", "not_found", status_code=404)
    return profile


def update_profile(db: Session, user: User, data: ProfileUpdate) -> Profile:
    profile = get_profile_for_user(db, user)
    payload = data.model_dump(exclude_unset=True)

    if "theme" in payload and payload["theme"] is not None:
        theme = str(payload["theme"]).strip().lower()
        allowed = PRO_THEMES if user.plan in PRO_PLANS else FREE_THEMES
        if theme not in allowed:
            raise AppError(
                "Tema indisponível no seu plano",
                "theme_plan_required" if theme in PRO_THEMES else "invalid_theme",
                status_code=403 if theme in PRO_THEMES - FREE_THEMES else 400,
            )
        payload["theme"] = theme

    if "brand_color" in payload:
        color = payload["brand_color"]
        if color is None or color == "":
            payload["brand_color"] = None
        else:
            if user.plan not in PRO_PLANS:
                raise AppError(
                    "Cor da marca requer plano Pro",
                    "brand_color_pro_only",
                    status_code=403,
                )
            normalized = str(color).strip()
            if not HEX_COLOR_RE.fullmatch(normalized):
                raise AppError(
                    "Cor inválida. Use formato #RRGGBB.",
                    "invalid_brand_color",
                    status_code=400,
                )
            payload["brand_color"] = normalized

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
    try:
        db.commit()
        db.refresh(profile)
    except IntegrityError as exc:
        db.rollback()
        if _is_slug_unique_violation(exc):
            raise AppError("Slug já está em uso", "invalid_slug", status_code=400) from None
        raise
    return profile


def _is_slug_unique_violation(exc: IntegrityError) -> bool:
    message = str(getattr(exc, "orig", exc)).lower()
    return "slug" in message or "ix_profiles_slug" in message
