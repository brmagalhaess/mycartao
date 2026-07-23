from __future__ import annotations

from uuid import UUID

import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db import get_db
from app.models.user import User

COOKIE_NAME = "access_token"


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        raise AppError("Não autenticado", "unauthorized", status_code=401)
    try:
        user_id = decode_access_token(raw)
        uid = UUID(user_id)
    except (jwt.PyJWTError, ValueError, KeyError):
        raise AppError("Não autenticado", "unauthorized", status_code=401) from None

    user = db.query(User).filter(User.id == uid).one_or_none()
    if user is None:
        raise AppError("Não autenticado", "unauthorized", status_code=401)
    return user


__all__ = ["get_db", "get_current_user"]
