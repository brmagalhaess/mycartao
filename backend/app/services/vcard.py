from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.models.card import Card
from app.models.profile import Profile
from app.services.qr import public_card_url


def generate_vcard(card: Card, profile: Profile) -> bytes:
    """RFC 6350-ish vCard 3.0 for contact save / NFC-ready URL."""
    fields: Dict[str, Any] = card.fields or {}
    fn = (profile.display_name or card.title or "").strip() or "MyCartao"
    lines: List[str] = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"FN:{_escape(fn)}",
    ]

    company = _field(fields, "company")
    if company:
        lines.append(f"ORG:{_escape(company)}")

    if profile.headline:
        lines.append(f"TITLE:{_escape(profile.headline)}")

    phone = _field(fields, "phone")
    if phone:
        lines.append(f"TEL;TYPE=CELL:{_escape(phone)}")

    whatsapp = _field(fields, "whatsapp")
    if whatsapp and whatsapp != phone:
        lines.append(f"TEL;TYPE=CELL:{_escape(whatsapp)}")

    email = _field(fields, "email")
    if email:
        lines.append(f"EMAIL;TYPE=INTERNET:{_escape(email)}")

    website = _field(fields, "website")
    if website:
        lines.append(f"URL:{_escape(website)}")

    linkedin = _field(fields, "linkedin")
    if linkedin:
        lines.append(f"URL;TYPE=LinkedIn:{_escape(linkedin)}")

    instagram = _field(fields, "instagram")
    if instagram:
        lines.append(f"URL;TYPE=Instagram:{_escape(instagram)}")

    lines.append(f"URL;TYPE=MyCartao:{_escape(public_card_url(card))}")
    lines.append("END:VCARD")
    return ("\r\n".join(lines) + "\r\n").encode("utf-8")


def _field(fields: Dict[str, Any], key: str) -> Optional[str]:
    value = fields.get(key)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )
