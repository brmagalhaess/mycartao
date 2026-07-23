from __future__ import annotations

import io
from typing import Literal

import qrcode
from qrcode.image.svg import SvgImage

from app.config import settings
from app.core.errors import AppError
from app.models.card import Card

QrFormat = Literal["png", "svg"]


def public_slug_or_id(card: Card) -> str:
    """Prefer profile.slug when set; otherwise card.id."""
    profile = card.profile
    if profile is not None and profile.slug:
        return profile.slug
    return str(card.id)


def public_card_url(card: Card) -> str:
    base = settings.public_app_url.rstrip("/")
    return f"{base}/c/{public_slug_or_id(card)}"


def generate_qr(url: str, fmt: QrFormat) -> bytes:
    if fmt == "png":
        img = qrcode.make(url)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    if fmt == "svg":
        qr = qrcode.QRCode(border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(image_factory=SvgImage)
        buf = io.BytesIO()
        img.save(buf)
        return buf.getvalue()

    raise AppError("format deve ser png ou svg", "invalid_format", status_code=400)
