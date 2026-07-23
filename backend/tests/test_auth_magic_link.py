from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
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
