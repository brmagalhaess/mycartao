from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.core.rate_limit import check_rate_limit
from app.db import get_db
from app.schemas.auth import MagicLinkRequest, OkResponse, UserResponse
from app.services import auth as auth_service

router = APIRouter()

COOKIE_NAME = "access_token"


def _cookie_secure() -> bool:
    return settings.public_app_url.lower().startswith("https://")


def _set_access_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(),
        path="/",
        max_age=settings.jwt_expire_minutes * 60,
    )


def _clear_access_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(),
    )


@router.post("/magic-link", response_model=OkResponse)
def request_magic_link(body: MagicLinkRequest, db: Session = Depends(get_db)):
    email = str(body.email).strip().lower()
    if not check_rate_limit(f"magic-link:{email}"):
        raise AppError(
            "Muitos pedidos. Tente novamente em alguns minutos.",
            "rate_limited",
            status_code=429,
        )
    auth_service.create_magic_link(db, email)
    return OkResponse()


@router.get("/verify", response_model=UserResponse)
def verify_magic_link(token: str, response: Response, db: Session = Depends(get_db)):
    user, jwt_token = auth_service.verify_magic_link(db, token)
    _set_access_cookie(response, jwt_token)
    return user


@router.post("/logout", response_model=OkResponse)
def logout(response: Response):
    _clear_access_cookie(response)
    return OkResponse()
