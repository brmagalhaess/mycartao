from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.security import hash_token
from app.db import SessionLocal
from app.main import app
from app.models.auth_token import MagicLinkToken
from app.models.profile import Profile
from app.models.user import User

client = TestClient(app)


@patch("app.services.auth.secrets.token_urlsafe", return_value="fixed-token")
@patch("app.services.auth.send_magic_link_email")
def test_verify(mock_send, mock_token):
    mock_send.return_value = None
    r = client.post("/api/v1/auth/magic-link", json={"email": "a@example.com"})
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    mock_send.assert_called_once()

    r = client.get("/api/v1/auth/verify", params={"token": "fixed-token"})
    assert r.status_code == 200
    assert "access_token" in r.cookies
    assert r.json()["email"] == "a@example.com"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "a@example.com").one()
        profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
        assert profile is not None
    finally:
        db.close()


@patch("app.services.auth.secrets.token_urlsafe", return_value="once-token")
@patch("app.services.auth.send_magic_link_email")
def test_token_single_use(mock_send, mock_token):
    mock_send.return_value = None
    client.post("/api/v1/auth/magic-link", json={"email": "once@example.com"})
    assert client.get("/api/v1/auth/verify", params={"token": "once-token"}).status_code == 200
    r = client.get("/api/v1/auth/verify", params={"token": "once-token"})
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"


def test_verify_invalid_token():
    r = client.get("/api/v1/auth/verify", params={"token": "does-not-exist"})
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"


@patch("app.services.auth.secrets.token_urlsafe", return_value="expired-token")
@patch("app.services.auth.send_magic_link_email")
def test_verify_expired_token(mock_send, mock_token):
    mock_send.return_value = None
    client.post("/api/v1/auth/magic-link", json={"email": "expired@example.com"})

    db = SessionLocal()
    try:
        row = (
            db.query(MagicLinkToken)
            .filter(MagicLinkToken.token_hash == hash_token("expired-token"))
            .one()
        )
        row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()
    finally:
        db.close()

    r = client.get("/api/v1/auth/verify", params={"token": "expired-token"})
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"


def test_whoami_missing_cookie():
    client.cookies.clear()
    r = client.get("/api/v1/auth/whoami")
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"


def test_whoami_invalid_token():
    client.cookies.clear()
    client.cookies.set("access_token", "not-a-valid-jwt")
    r = client.get("/api/v1/auth/whoami")
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"
    client.cookies.clear()


@patch("app.services.auth.secrets.token_urlsafe", return_value="whoami-token")
@patch("app.services.auth.send_magic_link_email")
def test_whoami_authenticated(mock_send, mock_token):
    mock_send.return_value = None
    client.cookies.clear()
    client.post("/api/v1/auth/magic-link", json={"email": "me@example.com"})
    verify = client.get("/api/v1/auth/verify", params={"token": "whoami-token"})
    assert verify.status_code == 200

    r = client.get("/api/v1/auth/whoami")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "me@example.com"
    assert "id" in body
    client.cookies.clear()


@patch("app.services.auth.secrets.token_urlsafe", return_value="fail-token")
@patch(
    "app.services.auth.send_magic_link_email",
    side_effect=RuntimeError("brevo unavailable"),
)
def test_magic_link_email_send_failed(mock_send, mock_token):
    r = client.post("/api/v1/auth/magic-link", json={"email": "fail@example.com"})
    assert r.status_code == 502
    assert r.json()["code"] == "email_send_failed"

    # Token must not remain usable after send failure (rolled back / deleted).
    verify = client.get("/api/v1/auth/verify", params={"token": "fail-token"})
    assert verify.status_code == 401
    assert verify.json()["code"] == "unauthorized"

    db = SessionLocal()
    try:
        remaining = (
            db.query(MagicLinkToken)
            .filter(MagicLinkToken.token_hash == hash_token("fail-token"))
            .one_or_none()
        )
        assert remaining is None
    finally:
        db.close()


@patch("app.services.auth.send_magic_link_email")
def test_logout_clears_cookie(mock_send):
    mock_send.return_value = None
    with patch("app.services.auth.secrets.token_urlsafe", return_value="logout-token"):
        client.post("/api/v1/auth/magic-link", json={"email": "out@example.com"})
        verify = client.get("/api/v1/auth/verify", params={"token": "logout-token"})
        assert "access_token" in verify.cookies

    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    # deleted cookie should be empty / absent for subsequent client state
    assert r.cookies.get("access_token") in (None, "")


@patch("app.services.auth.send_magic_link_email")
def test_magic_link_rate_limited(mock_send):
    mock_send.return_value = None
    email = {"email": "rate@example.com"}
    for _ in range(5):
        assert client.post("/api/v1/auth/magic-link", json=email).status_code == 200
    r = client.post("/api/v1/auth/magic-link", json=email)
    assert r.status_code == 429
    assert r.json()["code"] == "rate_limited"
