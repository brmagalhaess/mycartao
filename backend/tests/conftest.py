from __future__ import annotations

import os

# Prefer SQLite for local smoke tests when Postgres/Docker is unavailable.
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest

from app.db import Base, engine
import app.models  # noqa: F401 — register metadata


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
