from __future__ import annotations


def test_create_list_delete_lead(auth_client_free):
    cards = auth_client_free.get("/api/v1/cards")
    assert cards.status_code == 200
    card_list = cards.json()
    if not card_list:
        created = auth_client_free.post("/api/v1/cards", json={"title": "Lead card"})
        assert created.status_code == 201
        card_id = created.json()["id"]
    else:
        card_id = card_list[0]["id"]

    created = auth_client_free.post(
        f"/api/v1/public/cards/{card_id}/leads",
        json={
            "name": "Ana Visitante",
            "email": "ana@example.com",
            "phone": None,
            "message": "Oi!",
            "source": "card",
        },
    )
    assert created.status_code == 201, created.text
    lead = created.json()
    assert lead["name"] == "Ana Visitante"
    assert lead["email"] == "ana@example.com"

    listed = auth_client_free.get("/api/v1/leads")
    assert listed.status_code == 200
    assert any(x["id"] == lead["id"] for x in listed.json())

    deleted = auth_client_free.delete(f"/api/v1/leads/{lead['id']}")
    assert deleted.status_code == 204
    listed2 = auth_client_free.get("/api/v1/leads")
    assert all(x["id"] != lead["id"] for x in listed2.json())


def test_lead_requires_email_or_phone(auth_client_free):
    cards = auth_client_free.get("/api/v1/cards").json()
    if not cards:
        card_id = auth_client_free.post(
            "/api/v1/cards", json={"title": "X"}
        ).json()["id"]
    else:
        card_id = cards[0]["id"]

    r = auth_client_free.post(
        f"/api/v1/public/cards/{card_id}/leads",
        json={"name": "Sem contato", "source": "card"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_lead"


def test_lead_capture_can_be_disabled(auth_client_free):
    cards = auth_client_free.get("/api/v1/cards").json()
    if not cards:
        card_id = auth_client_free.post(
            "/api/v1/cards", json={"title": "Y"}
        ).json()["id"]
    else:
        card_id = cards[0]["id"]

    assert (
        auth_client_free.patch(
            "/api/v1/me", json={"lead_capture_enabled": False}
        ).status_code
        == 200
    )

    r = auth_client_free.post(
        f"/api/v1/public/cards/{card_id}/leads",
        json={"name": "Bloqueado", "email": "x@y.com", "source": "card"},
    )
    assert r.status_code == 404
    assert r.json()["code"] == "lead_capture_disabled"

    # restore for other tests sharing the DB session fixtures if any
    auth_client_free.patch("/api/v1/me", json={"lead_capture_enabled": True})
