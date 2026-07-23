from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> str:
    data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    return data["sub"]
