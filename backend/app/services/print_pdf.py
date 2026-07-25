from __future__ import annotations

import io
from typing import Any, Dict, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.core.errors import AppError
from app.models.card import Card
from app.models.profile import Profile
from app.services.entitlements import PRINT_TEMPLATES_FREE, PRINT_TEMPLATES_PRO, is_pro
from app.services.qr import public_card_url


def generate_print_pdf(
    card: Card,
    profile: Profile,
    *,
    watermark: bool,
    template: str = "classic",
    plan: str = "free",
) -> bytes:
    """Print Kit PDF. Free: classic + watermark. Pro: classic|compact|bold, no watermark."""
    allowed = PRINT_TEMPLATES_PRO if is_pro(plan) else PRINT_TEMPLATES_FREE
    tpl = (template or "classic").strip().lower()
    if tpl not in allowed:
        raise AppError(
            "Template de impressão indisponível no seu plano",
            "print_template_plan_required",
            status_code=403,
        )

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    fields: Dict[str, Any] = card.fields or {}
    display = (profile.display_name or card.title or "").strip() or "MyCartao"
    url = public_card_url(card)

    if tpl == "compact":
        _draw_compact(c, width, height, display, profile, card, fields, url)
    elif tpl == "bold":
        _draw_bold(c, width, height, display, profile, card, fields, url)
    else:
        _draw_classic(c, width, height, display, profile, card, fields, url)

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


def _draw_classic(c, width, height, display, profile, card, fields, url):
    margin = 25 * mm
    y = height - margin
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
    y = _draw_fields(c, margin, y, fields)
    y -= 4 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(margin, y, url)


def _draw_compact(c, width, height, display, profile, card, fields, url):
    # Business-card sized block centered on A4 (Print Kit Pro).
    card_w, card_h = 85 * mm, 55 * mm
    x0 = (width - card_w) / 2
    y0 = (height - card_h) / 2
    c.setStrokeColorRGB(0.05, 0.16, 0.18)
    c.setLineWidth(1.2)
    c.roundRect(x0, y0, card_w, card_h, 4 * mm)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x0 + 6 * mm, y0 + card_h - 12 * mm, display[:40])
    c.setFont("Helvetica", 9)
    if profile.headline:
        c.drawString(x0 + 6 * mm, y0 + card_h - 18 * mm, str(profile.headline)[:48])
    y = y0 + card_h - 28 * mm
    for label, key in (("Tel", "phone"), ("WA", "whatsapp"), ("Email", "email")):
        value = _field(fields, key)
        if not value:
            continue
        c.drawString(x0 + 6 * mm, y, f"{label}: {value[:36]}")
        y -= 5 * mm
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(x0 + 6 * mm, y0 + 6 * mm, url[:70])


def _draw_bold(c, width, height, display, profile, card, fields, url):
    margin = 20 * mm
    c.setFillColorRGB(0.02, 0.18, 0.18)
    c.rect(0, height - 55 * mm, width, 55 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(margin, height - 28 * mm, display[:42])
    if profile.headline:
        c.setFont("Helvetica", 12)
        c.drawString(margin, height - 40 * mm, str(profile.headline)[:80])
    c.setFillColorRGB(0.05, 0.16, 0.18)
    y = height - 70 * mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, card.title)
    y -= 12 * mm
    c.setFont("Helvetica", 11)
    y = _draw_fields(c, margin, y, fields)
    y -= 6 * mm
    c.setFillColorRGB(0.06, 0.46, 0.43)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, url)


def _draw_fields(c, margin, y, fields):
    c.setFont("Helvetica", 11)
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
    return y


def _field(fields: Dict[str, Any], key: str) -> Optional[str]:
    value = fields.get(key)
    if value is None:
        return None
    text = str(value).strip()
    return text or None
