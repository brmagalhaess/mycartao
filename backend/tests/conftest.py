from __future__ import annotations

import os

# Prefer SQLite for local smoke tests when Postgres/Docker is unavailable.
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest

from app.core.rate_limit import clear_rate_limits
from app.db import Base, engine
import app.models  # noqa: F401 — register metadata


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
