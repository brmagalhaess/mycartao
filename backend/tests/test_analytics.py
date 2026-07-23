from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def card_id(auth_client_free) -> str:
    created = auth_client_free.post(
        "/api/v1/cards", json={"title": "Analytics Card", "fields": {}}
    )
    assert created.status_code == 201
    return created.json()["id"]


def test_public_view_increments(auth_client_free, card_id):
    client = TestClient(app)
    assert client.get(f"/api/v1/public/cards/{card_id}").status_code == 200
    r = auth_client_free.get("/api/v1/analytics/summary", params={"days": 7})
    assert r.status_code == 200
    body = r.json()
    assert body["views"] >= 1
    assert "unique_approx" in body
    assert isinstance(body["by_day"], list)


def test_free_clamps_days_to_seven(auth_client_free, card_id):
    client = TestClient(app)
    client.get(f"/api/v1/public/cards/{card_id}")
    r = auth_client_free.get("/api/v1/analytics/summary", params={"days": 90})
    assert r.status_code == 200
    assert r.json()["views"] >= 1


def test_pro_accepts_up_to_ninety(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Pro Card", "fields": {}}
    ).json()
    client = TestClient(app)
    client.get(f"/api/v1/public/cards/{created['id']}")
    r = auth_client_pro.get("/api/v1/analytics/summary", params={"days": 90})
    assert r.status_code == 200
    assert r.json()["views"] >= 1
    # days beyond Pro max still succeeds (clamped)
    r2 = auth_client_pro.get("/api/v1/analytics/summary", params={"days": 120})
    assert r2.status_code == 200
