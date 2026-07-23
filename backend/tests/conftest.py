from __future__ import annotations

import base64
import os
from unittest.mock import patch

# Prefer SQLite for local smoke tests when Postgres/Docker is unavailable.
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limit import clear_rate_limits
from app.db import Base, SessionLocal, engine
from app.main import app as fastapi_app
from app.models.user import User
import app.models  # noqa: F401 — register metadata

# 1x1 PNG
_PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    clear_rate_limits()
    yield
    clear_rate_limits()


@pytest.fixture(autouse=True)
def _clean_tables():
    """Isolate tests on shared in-memory SQLite engine."""
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield


@pytest.fixture(autouse=True)
def _mock_minio_ensure_bucket():
    """Host has no Docker/MinIO — never hit real ensure_bucket on TestClient lifespan."""
    with patch("app.main.ensure_bucket"):
        yield


@pytest.fixture
def png_bytes() -> bytes:
    return _PNG_1X1


def _auth_client(email: str, token: str, plan: str) -> TestClient:
    client = TestClient(fastapi_app)
    with patch("app.services.auth.secrets.token_urlsafe", return_value=token):
        with patch("app.services.auth.send_magic_link_email"):
            assert client.post("/api/v1/auth/magic-link", json={"email": email}).status_code == 200
            r = client.get("/api/v1/auth/verify", params={"token": token})
            assert r.status_code == 200

    if plan != "free":
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).one()
            user.plan = plan
            db.commit()
        finally:
            db.close()
    return client


@pytest.fixture
def auth_client_free() -> TestClient:
    return _auth_client("free@example.com", "free-token", "free")


@pytest.fixture
def auth_client_pro() -> TestClient:
    return _auth_client("pro@example.com", "pro-token", "pro")
