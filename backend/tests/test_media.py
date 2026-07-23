from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app as fastapi_app
from app.services.minio_client import public_url


def _fake_upload(key: str, data: bytes, content_type: str) -> str:
    return public_url(key)


def test_public_url_is_same_origin():
    assert public_url("user/avatar/a.png") == "/api/v1/media/files/user/avatar/a.png"


def test_upload_avatar(auth_client_free, png_bytes):
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=_fake_upload,
    ):
        r = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert r.status_code == 201
    body = r.json()
    assert body["url"].startswith("/api/v1/media/files/")
    assert body["purpose"] == "avatar"
    assert "id" in body


def test_serve_media_file_proxies_minio():
    mock_obj = MagicMock()
    mock_obj.headers = {"Content-Type": "image/png"}
    mock_obj.stream.return_value = iter([b"\x89PNG"])

    with patch(
        "app.api.v1.media.minio_client.open_object",
        return_value=mock_obj,
    ):
        r = TestClient(fastapi_app).get("/api/v1/media/files/user/avatar/a.png")

    assert r.status_code == 200
    assert r.content == b"\x89PNG"
    assert r.headers["content-type"].startswith("image/png")
    mock_obj.close.assert_called_once()
    mock_obj.release_conn.assert_called_once()


def test_free_can_replace_avatar(auth_client_free, png_bytes):
    """Free may change avatar anytime (replace), not locked after first upload."""
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=_fake_upload,
    ):
        first = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
        assert first.status_code == 201
        first_url = first.json()["url"]
        second = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("b.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert second.status_code == 201
    assert second.json()["url"].startswith("/api/v1/media/files/")
    assert second.json()["url"] != first_url


def test_reject_invalid_mime(auth_client_free):
    r = auth_client_free.post(
        "/api/v1/media/upload",
        files={"file": ("a.gif", b"GIF89a", "image/gif")},
        data={"purpose": "avatar"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_mime"


def test_reject_too_large(auth_client_free):
    big = b"x" * (5 * 1024 * 1024 + 1)
    r = auth_client_free.post(
        "/api/v1/media/upload",
        files={"file": ("a.png", big, "image/png")},
        data={"purpose": "avatar"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "file_too_large"


def test_pro_can_upload_second_avatar(auth_client_pro, png_bytes):
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=_fake_upload,
    ):
        assert (
            auth_client_pro.post(
                "/api/v1/media/upload",
                files={"file": ("a.png", png_bytes, "image/png")},
                data={"purpose": "avatar"},
            ).status_code
            == 201
        )
        second = auth_client_pro.post(
            "/api/v1/media/upload",
            files={"file": ("b.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert second.status_code == 201
