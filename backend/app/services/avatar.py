from __future__ import annotations

import html
import re
from typing import Iterator, Optional
from urllib.parse import unquote

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.media import MediaAsset
from app.models.profile import Profile
from app.models.user import User
from app.services import minio_client

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_MEDIA_FILES_PREFIX = "/api/v1/media/files/"


def normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email))


def clamp_size(s: int | None) -> int:
    if s is None:
        return 200
    return max(80, min(512, int(s)))


def placeholder_svg(label: str, size: int) -> bytes:
    initial = (label[:1] or "?").upper()
    safe = html.escape(initial, quote=True)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">'
        f'<rect width="100%" height="100%" fill="#0f766e"/>'
        f'<circle cx="{size / 2}" cy="{size / 2}" r="{size * 0.42}" fill="#14b8a6"/>'
        f'<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" '
        f'fill="#faf8f5" font-family="system-ui,sans-serif" '
        f'font-size="{int(size * 0.42)}" font-weight="600">{safe}</text>'
        f"</svg>"
    )
    return svg.encode("utf-8")


def _bucket_key_from_avatar_url(raw: str) -> Optional[str]:
    value = (raw or "").strip()
    if not value:
        return None
    if value.startswith(_MEDIA_FILES_PREFIX):
        key = unquote(value[len(_MEDIA_FILES_PREFIX) :])
        return key.lstrip("/") or None
    # Allow relative "/media/files/..." just in case
    marker = "/media/files/"
    if marker in value:
        key = unquote(value.split(marker, 1)[1])
        return key.lstrip("/") or None
    # Bare MinIO/object bucket key (not an external URL)
    if value.startswith(("http://", "https://")):
        return None
    return value.lstrip("/") or None


def _read_object(bucket_key: str) -> Optional[tuple[bytes, str]]:
    obj = minio_client.open_object(bucket_key)
    if obj is None:
        return None
    try:
        data = obj.read()
        content_type = obj.headers.get("Content-Type") or "application/octet-stream"
        return data, content_type
    finally:
        obj.close()
        obj.release_conn()


def _iter_bucket_keys(
    db: Session, user: User, profile: Optional[Profile]
) -> Iterator[str]:
    """Yield candidate object keys in priority order, de-duplicated.

    Order: profile.avatar_key → latest MediaAsset(purpose=avatar) →
    primary card fields.avatar. Callers must try each key (open/read);
    a failed read must continue to the next source, not skip to placeholder.
    """
    seen: set[str] = set()

    def _emit(key: Optional[str]) -> Iterator[str]:
        if key and key not in seen:
            seen.add(key)
            yield key

    if profile and profile.avatar_key:
        yield from _emit(profile.avatar_key)

    asset = (
        db.query(MediaAsset)
        .filter(MediaAsset.owner_id == user.id, MediaAsset.purpose == "avatar")
        .order_by(MediaAsset.created_at.desc())
        .first()
    )
    if asset is not None:
        yield from _emit(asset.bucket_key)

    if profile is None:
        return

    card = (
        db.query(Card)
        .filter(Card.profile_id == profile.id, Card.is_primary.is_(True))
        .first()
    )
    if card is None:
        return
    fields = card.fields or {}
    avatar = fields.get("avatar")
    if isinstance(avatar, str):
        yield from _emit(_bucket_key_from_avatar_url(avatar))


def resolve_avatar(db: Session, email: str, size: int) -> tuple[bytes, str]:
    """Resolve public avatar bytes + content-type for an email.

    Unknown emails and users without a photo both get an SVG placeholder (200).
    """
    email_norm = normalize_email(email)
    user = db.query(User).filter(User.email == email_norm).one_or_none()
    if user is None:
        return placeholder_svg(email_norm, size), "image/svg+xml"

    profile = (
        db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
        if user.profile is None
        else user.profile
    )
    label = (profile.display_name if profile and profile.display_name else None) or email_norm

    for bucket_key in _iter_bucket_keys(db, user, profile):
        loaded = _read_object(bucket_key)
        if loaded is not None:
            return loaded

    return placeholder_svg(label, size), "image/svg+xml"
