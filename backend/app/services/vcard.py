from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.models.card import Card
from app.models.profile import Profile
from app.services.qr import public_card_url


def generate_vcard(card: Card, profile: Profile | None) -> bytes:
    """RFC 6350-ish vCard 3.0 for contact save / NFC-ready URL.

    Always emits structured ``N`` alongside ``FN``. Without ``N``, iOS Contacts
    often shows ``ORG`` (company) as the contact name when company is set.
    """
    fields: Dict[str, Any] = card.fields or {}
    company = _field(fields, "company")
    fn = _person_display_name(profile, card, company)
    lines: List[str] = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"N:{_structured_name(fn)}",
        f"FN:{_escape(fn)}",
    ]

    if company:
        lines.append(f"ORG:{_escape(company)}")

    headline = profile.headline if profile else None
    if headline:
        lines.append(f"TITLE:{_escape(headline)}")

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


def _person_display_name(
    profile: Profile | None, card: Card, company: Optional[str]
) -> str:
    """Prefer profile name; never fall back to company (iOS ORG confusion)."""
    candidates = [
        (profile.display_name if profile else None) or "",
        card.title or "",
    ]
    for raw in candidates:
        name = raw.strip()
        if not name:
            continue
        if company and name.casefold() == company.casefold():
            continue
        return name
    return "MyCartao"


def _structured_name(fn: str) -> str:
    """vCard N: Family;Given;Additional;Prefix;Suffix."""
    parts = [p for p in fn.split() if p]
    if len(parts) >= 2:
        family = parts[-1]
        given = " ".join(parts[:-1])
        return f"{_escape(family)};{_escape(given)};;;"
    return f";{_escape(fn)};;;"


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
