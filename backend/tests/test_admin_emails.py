from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.models.user import User


def _login(client: TestClient, email: str, token: str) -> None:
    with patch("app.services.auth.secrets.token_urlsafe", return_value=token):
        with patch("app.services.auth.send_magic_link_email"):
            assert (
                client.post("/api/v1/auth/magic-link", json={"email": email}).status_code
                == 200
            )
            assert client.get("/api/v1/auth/verify", params={"token": token}).status_code == 200


def test_admin_email_promoted_on_login(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "boss@example.com, Other@x.com")
    client = TestClient(app)
    _login(client, "boss@example.com", "admin-token-1")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "boss@example.com").one()
        assert user.plan == "admin"
    finally:
        db.close()


def test_non_admin_email_stays_free(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "boss@example.com")
    client = TestClient(app)
    _login(client, "regular@example.com", "admin-token-2")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "regular@example.com").one()
        assert user.plan == "free"
    finally:
        db.close()


def test_admin_email_case_insensitive(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "Boss@Example.com")
    client = TestClient(app)
    _login(client, "boss@example.com", "admin-token-3")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "boss@example.com").one()
        assert user.plan == "admin"
    finally:
        db.close()
