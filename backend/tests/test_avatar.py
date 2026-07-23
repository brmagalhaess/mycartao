from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models.card import Card
from app.models.media import MediaAsset
from app.models.user import User
from app.services.minio_client import public_url


def _fake_upload(key: str, data: bytes, content_type: str) -> str:
    return public_url(key)


def _mock_minio_object(data: bytes, content_type: str = "image/png") -> MagicMock:
    mock_obj = MagicMock()
    mock_obj.headers = {"Content-Type": content_type}
    mock_obj.read.return_value = data
    return mock_obj


def _user_free(db) -> User:
    return db.query(User).filter(User.email == "free@example.com").one()


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
        user = _user_free(db)
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


def test_avatar_resolves_via_media_asset_when_avatar_key_missing(auth_client_free, png_bytes):
    asset_key = "avatars/media-asset-only.png"
    db = SessionLocal()
    try:
        user = _user_free(db)
        assert user.profile is not None
        user.profile.avatar_key = None
        db.add(
            MediaAsset(
                owner_id=user.id,
                bucket_key=asset_key,
                mime="image/png",
                purpose="avatar",
            )
        )
        db.commit()
    finally:
        db.close()

    mock_obj = _mock_minio_object(png_bytes)
    with patch(
        "app.services.avatar.minio_client.open_object",
        return_value=mock_obj,
    ) as open_mock:
        r = TestClient(app).get(
            "/api/v1/public/avatar",
            params={"email": "free@example.com"},
        )

    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == png_bytes
    open_mock.assert_called_once_with(asset_key)


def test_avatar_resolves_via_primary_card_fields_avatar(auth_client_free, png_bytes):
    card_key = "avatars/from-card-fields.png"
    db = SessionLocal()
    try:
        user = _user_free(db)
        assert user.profile is not None
        user.profile.avatar_key = None
        db.add(
            Card(
                profile_id=user.profile.id,
                title="Primary",
                fields={"avatar": f"/api/v1/media/files/{card_key}"},
                is_primary=True,
            )
        )
        db.commit()
    finally:
        db.close()

    mock_obj = _mock_minio_object(png_bytes)
    with patch(
        "app.services.avatar.minio_client.open_object",
        return_value=mock_obj,
    ) as open_mock:
        r = TestClient(app).get(
            "/api/v1/public/avatar",
            params={"email": "free@example.com"},
        )

    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == png_bytes
    open_mock.assert_called_once_with(card_key)


def test_avatar_stale_avatar_key_falls_through_to_media_asset(auth_client_free, png_bytes):
    stale_key = "avatars/stale-missing.png"
    good_key = "avatars/media-asset-good.png"
    db = SessionLocal()
    try:
        user = _user_free(db)
        assert user.profile is not None
        user.profile.avatar_key = stale_key
        db.add(
            MediaAsset(
                owner_id=user.id,
                bucket_key=good_key,
                mime="image/png",
                purpose="avatar",
            )
        )
        db.commit()
    finally:
        db.close()

    mock_obj = _mock_minio_object(png_bytes)

    def _open(key: str):
        if key == stale_key:
            return None
        if key == good_key:
            return mock_obj
        return None

    with patch(
        "app.services.avatar.minio_client.open_object",
        side_effect=_open,
    ) as open_mock:
        r = TestClient(app).get(
            "/api/v1/public/avatar",
            params={"email": "free@example.com"},
        )

    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == png_bytes
    assert [c.args[0] for c in open_mock.call_args_list] == [stale_key, good_key]
