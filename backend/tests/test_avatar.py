from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models.user import User
from app.services.minio_client import public_url


def _fake_upload(key: str, data: bytes, content_type: str) -> str:
    return public_url(key)


def _mock_minio_object(data: bytes, content_type: str = "image/png") -> MagicMock:
    mock_obj = MagicMock()
    mock_obj.headers = {"Content-Type": content_type}
    mock_obj.read.return_value = data
    return mock_obj


def test_avatar_invalid_email():
    r = TestClient(app).get("/api/v1/public/avatar", params={"email": "not-an-email"})
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_email"


def test_avatar_unknown_email_returns_svg_placeholder():
    r = TestClient(app).get(
        "/api/v1/public/avatar",
        params={"email": "nobody-xyz@example.com"},
    )
    assert r.status_code == 200
    assert "image/svg" in r.headers["content-type"]
    assert b"<svg" in r.content.lower()


def test_avatar_user_without_photo_returns_svg_placeholder(auth_client_free):
    # authenticated free@example.com exists but has no avatar media
    r = TestClient(app).get(
        "/api/v1/public/avatar",
        params={"email": "free@example.com"},
    )
    assert r.status_code == 200
    assert "image/svg" in r.headers["content-type"]
    assert b"<svg" in r.content.lower()


def test_avatar_with_media_streams_bytes(auth_client_free, png_bytes):
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=_fake_upload,
    ):
        up = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert up.status_code == 201
    url = up.json()["url"]
    assert url.startswith("/api/v1/media/files/")
    bucket_key = url.split("/api/v1/media/files/", 1)[1]

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "free@example.com").one()
        assert user.profile is not None
        assert user.profile.avatar_key == bucket_key
    finally:
        db.close()

    mock_obj = _mock_minio_object(png_bytes)
    with patch(
        "app.services.avatar.minio_client.open_object",
        return_value=mock_obj,
    ):
        r = TestClient(app).get(
            "/api/v1/public/avatar",
            params={"email": "free@example.com", "s": 128},
        )

    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == png_bytes
    assert "max-age=3600" in r.headers.get("cache-control", "")
    mock_obj.close.assert_called_once()
    mock_obj.release_conn.assert_called_once()
