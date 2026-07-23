from __future__ import annotations


def test_free_card_limit(auth_client_free):
    assert auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {}}).status_code == 201
    r = auth_client_free.post("/api/v1/cards", json={"title": "B", "fields": {}})
    assert r.status_code == 403
    assert r.json()["code"] == "card_limit_reached"


def test_public_by_id(auth_client_free):
    created = auth_client_free.post(
        "/api/v1/cards", json={"title": "A", "fields": {"phone": "11999999999"}}
    ).json()
    assert (
        auth_client_free.patch(
            "/api/v1/me",
            json={
                "display_name": "Bruno Free",
                "headline": "Dev",
                "theme": "classic",
            },
        ).status_code
        == 200
    )
    r = auth_client_free.get(f"/api/v1/public/cards/{created['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "A"
    assert body["fields"]["phone"] == "11999999999"
    assert body["display_name"] == "Bruno Free"
    assert body["headline"] == "Dev"
    assert body["theme"] == "classic"
    assert body["show_mycartao_branding"] is True
    assert body["brand_color"] is None


def test_free_cannot_set_brand_color(auth_client_free):
    r = auth_client_free.patch(
        "/api/v1/me",
        json={"brand_color": "#ff0000"},
    )
    assert r.status_code == 403
    assert r.json()["code"] == "brand_color_pro_only"


def test_pro_public_hides_branding_and_exposes_brand_color(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Pro Card", "fields": {}}
    ).json()
    assert (
        auth_client_pro.patch(
            "/api/v1/me",
            json={"theme": "ink", "brand_color": "#aabbcc", "display_name": "Pro"},
        ).status_code
        == 200
    )
    r = auth_client_pro.get(f"/api/v1/public/cards/{created['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["theme"] == "ink"
    assert body["brand_color"] == "#aabbcc"
    assert body["show_mycartao_branding"] is False
    assert body["display_name"] == "Pro"


def test_cards_crud(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/cards",
        json={
            "title": "Work",
            "fields": {
                "phone": "11999999999",
                "email": "a@b.com",
                "company": "Crown",
                "whatsapp": "11999999999",
                "website": "https://example.com",
                "linkedin": "https://linkedin.com/in/x",
                "instagram": "https://instagram.com/x",
            },
        },
    )
    assert created.status_code == 201
    card = created.json()
    card_id = card["id"]
    assert card["title"] == "Work"
    assert card["fields"]["company"] == "Crown"

    listed = auth_client_pro.get("/api/v1/cards")
    assert listed.status_code == 200
    assert len(listed.json()) >= 1

    got = auth_client_pro.get(f"/api/v1/cards/{card_id}")
    assert got.status_code == 200
    assert got.json()["id"] == card_id

    patched = auth_client_pro.patch(
        f"/api/v1/cards/{card_id}",
        json={"title": "Work Updated", "fields": {"email": "new@b.com"}},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Work Updated"
    assert patched.json()["fields"]["email"] == "new@b.com"

    deleted = auth_client_pro.delete(f"/api/v1/cards/{card_id}")
    assert deleted.status_code == 204
    assert auth_client_pro.get(f"/api/v1/cards/{card_id}").status_code == 404


def test_pro_can_create_multiple_cards(auth_client_pro):
    assert auth_client_pro.post("/api/v1/cards", json={"title": "A", "fields": {}}).status_code == 201
    assert auth_client_pro.post("/api/v1/cards", json={"title": "B", "fields": {}}).status_code == 201


def test_public_by_profile_slug(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "bruno-card"}).status_code == 200
    created = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Primary", "fields": {"whatsapp": "11988887777"}}
    ).json()
    r = auth_client_pro.get("/api/v1/public/cards/bruno-card")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]
    assert r.json()["title"] == "Primary"


def test_public_not_found():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/v1/public/cards/does-not-exist")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found"
