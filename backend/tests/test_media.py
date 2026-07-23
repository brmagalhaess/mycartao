from __future__ import annotations

from unittest.mock import patch


def test_upload_avatar(auth_client_free, png_bytes):
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=lambda key, data, content_type: f"http://localhost:9000/mycartao/{key}",
    ):
        r = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert r.status_code == 201
    body = r.json()
    assert body["url"].startswith("http")
    assert body["purpose"] == "avatar"
    assert "id" in body


def test_free_avatar_limit(auth_client_free, png_bytes):
    with patch(
        "app.api.v1.media.minio_client.upload_bytes",
        side_effect=lambda key, data, content_type: f"http://localhost:9000/mycartao/{key}",
    ):
        first = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
        assert first.status_code == 201
        second = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("b.png", png_bytes, "image/png")},
            data={"purpose": "avatar"},
        )
    assert second.status_code == 403
    assert second.json()["code"] == "avatar_limit_reached"


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
        side_effect=lambda key, data, content_type: f"http://localhost:9000/mycartao/{key}",
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
