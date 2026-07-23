from __future__ import annotations

from datetime import datetime
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app as fastapi_app
from app.models.user import User
from tests.conftest import _auth_client


def _admin_client() -> TestClient:
    return _auth_client("admin@example.com", "admin-token", "admin")


def test_admin_users_forbidden_for_free(auth_client_free):
    r = auth_client_free.get("/api/v1/admin/users")
    assert r.status_code == 403
    assert r.json()["code"] == "admin_required"


def test_admin_users_list_and_patch_plan(auth_client_free):
    admin = _admin_client()

    listed = admin.get("/api/v1/admin/users")
    assert listed.status_code == 200
    users = listed.json()
    assert isinstance(users, list)
    assert any(u["email"] == "free@example.com" for u in users)

    free_id = next(u["id"] for u in users if u["email"] == "free@example.com")
    patched = admin.patch(f"/api/v1/admin/users/{free_id}", json={"plan": "pro"})
    assert patched.status_code == 200
    assert patched.json()["plan"] == "pro"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == UUID(free_id)).one()
        assert user.plan == "pro"
    finally:
        db.close()


def test_smart_rules_forbidden_for_free(auth_client_free):
    r = auth_client_free.get("/api/v1/smart-rules")
    assert r.status_code == 403
    assert r.json()["code"] == "plan_required"

    r = auth_client_free.post(
        "/api/v1/smart-rules",
        json={"conditions": {"always": True}, "target": "whatsapp"},
    )
    assert r.status_code == 403
    assert r.json()["code"] == "plan_required"


def test_smart_rules_crud_pro(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/smart-rules",
        json={"conditions": {"always": True}, "target": "whatsapp"},
    )
    assert created.status_code == 201, created.text
    rule = created.json()
    rule_id = rule["id"]
    assert rule["target"] == "whatsapp"
    assert rule["conditions"]["always"] is True

    listed = auth_client_pro.get("/api/v1/smart-rules")
    assert listed.status_code == 200
    assert any(x["id"] == rule_id for x in listed.json())

    got = auth_client_pro.get(f"/api/v1/smart-rules/{rule_id}")
    assert got.status_code == 200
    assert got.json()["id"] == rule_id

    patched = auth_client_pro.patch(
        f"/api/v1/smart-rules/{rule_id}",
        json={"conditions": {"hour_range": [9, 18]}, "target": "portfolio"},
    )
    assert patched.status_code == 200
    body = patched.json()
    assert body["target"] == "portfolio"
    assert body["conditions"]["hour_range"] == [9, 18]

    deleted = auth_client_pro.delete(f"/api/v1/smart-rules/{rule_id}")
    assert deleted.status_code == 204
    assert auth_client_pro.get(f"/api/v1/smart-rules/{rule_id}").status_code == 404


def test_public_go_default_card(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "go-default"}).status_code == 200
    card = auth_client_pro.post(
        "/api/v1/cards",
        json={"title": "Primary", "fields": {"whatsapp": "5511999999999"}, "is_primary": True},
    ).json()

    r = auth_client_pro.get("/api/v1/public/go/go-default")
    assert r.status_code == 200
    body = r.json()
    assert body["target"] == "card"
    assert body["url"].endswith(f"/c/go-default") or body["url"].endswith(f"/c/{card['id']}")


def test_public_go_always_whatsapp(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "go-wa"}).status_code == 200
    auth_client_pro.post(
        "/api/v1/cards",
        json={"title": "WA", "fields": {"whatsapp": "5511988877766"}, "is_primary": True},
    )
    assert (
        auth_client_pro.post(
            "/api/v1/smart-rules",
            json={"conditions": {"always": True}, "target": "whatsapp"},
        ).status_code
        == 201
    )

    r = auth_client_pro.get("/api/v1/public/go/go-wa")
    assert r.status_code == 200
    body = r.json()
    assert body["target"] == "whatsapp"
    assert body["url"] == "https://wa.me/5511988877766"


def test_public_go_hour_range_portfolio(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "go-hours"}).status_code == 200
    auth_client_pro.post(
        "/api/v1/cards",
        json={"title": "Hours", "fields": {"phone": "11999999999"}, "is_primary": True},
    )
    assert (
        auth_client_pro.post(
            "/api/v1/smart-rules",
            json={"conditions": {"hour_range": [9, 18]}, "target": "portfolio"},
        ).status_code
        == 201
    )

    with patch("app.services.smart_rules.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 7, 22, 10, 0, 0)
        r = auth_client_pro.get("/api/v1/public/go/go-hours")
    assert r.status_code == 200
    body = r.json()
    assert body["target"] == "portfolio"
    assert body["url"].endswith("/p/go-hours")

    with patch("app.services.smart_rules.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 7, 22, 20, 0, 0)
        r = auth_client_pro.get("/api/v1/public/go/go-hours")
    assert r.status_code == 200
    assert r.json()["target"] == "card"


def test_public_go_not_found():
    client = TestClient(fastapi_app)
    r = client.get("/api/v1/public/go/does-not-exist")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found"
