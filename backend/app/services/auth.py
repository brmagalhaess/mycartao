from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.core.security import create_access_token, hash_token
from app.models.auth_token import MagicLinkToken
from app.models.profile import Profile
from app.models.user import User
from app.services.brevo import send_magic_link_email

MAGIC_LINK_TTL = timedelta(minutes=15)


def create_magic_link(db: Session, email: str) -> str:
    """Create a magic link token, persist its hash, send email. Returns raw token.

    On email send failure the token row is deleted so no usable orphan remains.
    """
    email_norm = email.strip().lower()
    raw = secrets.token_urlsafe(32)
    token_hash = hash_token(raw)
    row = MagicLinkToken(
        token_hash=token_hash,
        email=email_norm,
        expires_at=datetime.now(timezone.utc) + MAGIC_LINK_TTL,
    )
    db.add(row)
    db.commit()

    link = f"{settings.public_app_url.rstrip('/')}/auth/verify?token={raw}"
    try:
        send_magic_link_email(email_norm, link)
    except Exception as exc:
        # Rollback usable orphan: delete by hash (session may have expired the row).
        db.query(MagicLinkToken).filter(MagicLinkToken.token_hash == token_hash).delete()
        db.commit()
        raise AppError(
            "Falha ao enviar e-mail de acesso",
            "email_send_failed",
            status_code=502,
        ) from exc
    return raw


def verify_magic_link(db: Session, raw_token: str) -> tuple[User, str]:
    """Validate token, ensure user+profile exist, mark used. Returns (user, jwt)."""
    token_hash = hash_token(raw_token)
    row = (
        db.query(MagicLinkToken)
        .filter(MagicLinkToken.token_hash == token_hash)
        .one_or_none()
    )
    now = datetime.now(timezone.utc)
    if row is None or row.used_at is not None:
        raise AppError("Token inválido ou já utilizado", "unauthorized", status_code=401)

    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        raise AppError("Token expirado", "unauthorized", status_code=401)

    row.used_at = now
    user = db.query(User).filter(User.email == row.email).one_or_none()
    if user is None:
        user = User(email=row.email, plan="free")
        db.add(user)
        db.flush()

    profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
    if profile is None:
        db.add(Profile(user_id=user.id))

    db.commit()
    db.refresh(user)
    jwt_token = create_access_token(str(user.id))
    return user, jwt_token
