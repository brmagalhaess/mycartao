from __future__ import annotations

import io
from typing import Any, Dict, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.card import Card
from app.models.profile import Profile
from app.services.qr import public_card_url


def generate_print_pdf(
    card: Card,
    profile: Profile,
    *,
    watermark: bool,
) -> bytes:
    """Single-page A4 card layout for print; Free plan gets a diagonal watermark."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    fields: Dict[str, Any] = card.fields or {}

    margin = 25 * mm
    y = height - margin

    display = (profile.display_name or card.title or "").strip() or "MyCartao"
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin, y, display)
    y -= 10 * mm

    if profile.headline:
        c.setFont("Helvetica", 12)
        c.drawString(margin, y, str(profile.headline)[:120])
        y -= 8 * mm

    c.setFont("Helvetica", 11)
    c.drawString(margin, y, card.title)
    y -= 10 * mm

    for label, key in (
        ("Empresa", "company"),
        ("Telefone", "phone"),
        ("WhatsApp", "whatsapp"),
        ("E-mail", "email"),
        ("Site", "website"),
        ("LinkedIn", "linkedin"),
        ("Instagram", "instagram"),
    ):
        value = _field(fields, key)
        if not value:
            continue
        c.drawString(margin, y, f"{label}: {value}")
        y -= 7 * mm

    url = public_card_url(card)
    y -= 4 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(margin, y, url)

    if watermark:
        c.saveState()
        c.setFillColorRGB(0.7, 0.7, 0.7, alpha=0.35)
        c.setFont("Helvetica-Bold", 48)
        c.translate(width / 2, height / 2)
        c.rotate(40)
        c.drawCentredString(0, 0, "MyCartao Free")
        c.restoreState()

    c.showPage()
    c.save()
    return buf.getvalue()


def _field(fields: Dict[str, Any], key: str) -> Optional[str]:
    value = fields.get(key)
    if value is None:
        return None
    text = str(value).strip()
    return text or None
