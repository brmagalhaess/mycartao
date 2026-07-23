from __future__ import annotations

import pytest


@pytest.fixture
def card_id(auth_client_free):
    r = auth_client_free.post(
        "/api/v1/cards",
        json={
            "title": "Export Card",
            "fields": {
                "phone": "11999999999",
                "email": "export@example.com",
                "company": "Crown",
            },
        },
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_qr_png(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/cards/{card_id}/qr", params={"format": "png"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_qr_svg(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/cards/{card_id}/qr", params={"format": "svg"})
    assert r.status_code == 200
    assert "image/svg" in r.headers["content-type"]
    assert b"<svg" in r.content.lower()


def test_print_pdf_free_has_body(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/cards/{card_id}/print.pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


def test_vcard_auth(auth_client_free, card_id):
    # Ensure profile display_name is the person shown in FN/N (not company).
    me = auth_client_free.patch(
        "/api/v1/me", json={"display_name": "Ana Silva"}
    )
    assert me.status_code == 200

    r = auth_client_free.get(f"/api/v1/cards/{card_id}/vcard.vcf")
    assert r.status_code == 200
    assert "text/vcard" in r.headers["content-type"]
    body = r.content.decode("utf-8")
    assert "BEGIN:VCARD" in body
    assert "END:VCARD" in body
    assert "FN:Ana Silva" in body
    assert "N:Silva;Ana;;;" in body
    assert "ORG:Crown" in body
    assert "export@example.com" in body
    assert "FN:Crown" not in body


def test_vcard_public(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/public/cards/{card_id}/vcard.vcf")
    assert r.status_code == 200
    assert "BEGIN:VCARD" in r.content.decode("utf-8")


def test_print_pdf_pro_no_error(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Pro Card", "fields": {"email": "pro@x.com"}}
    )
    assert created.status_code == 201
    card_id = created.json()["id"]
    r = auth_client_pro.get(f"/api/v1/cards/{card_id}/print.pdf")
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"
