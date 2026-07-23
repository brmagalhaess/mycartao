from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models.user import User


def _login(client: TestClient, email: str, token: str) -> None:
    with patch("app.services.auth.secrets.token_urlsafe", return_value=token):
        with patch("app.services.auth.send_magic_link_email"):
            assert client.post("/api/v1/auth/magic-link", json={"email": email}).status_code == 200
            r = client.get("/api/v1/auth/verify", params={"token": token})
            assert r.status_code == 200


def test_free_cannot_set_slug(auth_client_free):
    r = auth_client_free.patch("/api/v1/me/slug", json={"slug": "bruno"})
    assert r.status_code == 403
    assert r.json()["code"] == "plan_required"


def test_pro_can_set_slug(auth_client_pro):
    r = auth_client_pro.patch("/api/v1/me/slug", json={"slug": "bruno"})
    assert r.status_code == 200
    assert r.json()["slug"] == "bruno"


def test_invalid_slug_rejected(auth_client_pro):
    r = auth_client_pro.patch("/api/v1/me/slug", json={"slug": "AB"})
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_slug"


def test_slug_must_be_unique(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "taken"}).status_code == 200

    other = TestClient(app)
    _login(other, "other-pro@example.com", "other-pro-token")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "other-pro@example.com").one()
        user.plan = "pro"
        db.commit()
    finally:
        db.close()

    r = other.patch("/api/v1/me/slug", json={"slug": "taken"})
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_slug"


def test_get_and_patch_me(auth_client_free):
    r = auth_client_free.get("/api/v1/me")
    assert r.status_code == 200
    body = r.json()
    assert body["slug"] is None
    assert "theme" in body
    assert "brand_color" in body

    r = auth_client_free.patch(
        "/api/v1/me",
        json={
            "display_name": "Bruno",
            "headline": "Dev",
            "theme": "minimal",
            "brand_color": "#1a1a1a",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["display_name"] == "Bruno"
    assert body["headline"] == "Dev"
    assert body["theme"] == "minimal"
    assert body["brand_color"] == "#1a1a1a"
