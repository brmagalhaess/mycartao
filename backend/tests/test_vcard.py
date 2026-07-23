from __future__ import annotations

from types import SimpleNamespace

from app.services.vcard import generate_vcard


def _card(fields: dict, title: str = "Meu cartão", profile=None):
    return SimpleNamespace(
        title=title,
        fields=fields,
        id="00000000-0000-0000-0000-000000000001",
        profile=profile or SimpleNamespace(slug=None),
    )


def _profile(display_name: str | None, headline: str | None = None):
    return SimpleNamespace(display_name=display_name, headline=headline, slug=None)


def test_vcard_fn_is_person_name_not_company():
    card = _card({"company": "CrownTech", "email": "a@b.com", "phone": "11999999999"})
    profile = _profile("Bruno Magalhães", headline="CEO")
    body = generate_vcard(card, profile).decode("utf-8")

    assert "FN:Bruno Magalhães" in body
    assert "ORG:CrownTech" in body
    assert "N:Magalhães;Bruno;;;" in body
    # Contact must not present as organization-only (iOS ORG takeover)
    assert "FN:CrownTech" not in body


def test_vcard_falls_back_to_title_never_company():
    card = _card({"company": "CrownTech"}, title="Cartão Pessoal")
    profile = _profile(None)
    body = generate_vcard(card, profile).decode("utf-8")

    assert "FN:Cartão Pessoal" in body
    assert "ORG:CrownTech" in body
    assert "N:" in body
    assert "FN:CrownTech" not in body
