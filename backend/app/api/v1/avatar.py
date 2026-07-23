from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.rate_limit import check_rate_limit
from app.db import get_db
from app.services import avatar as avatar_service

public_router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@public_router.get("")
def public_avatar(
    request: Request,
    email: str = Query(...),
    s: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    # img embeds can hit this many times; default rate limit (5) breaks them
    if not check_rate_limit(f"avatar:{_client_ip(request)}", max_requests=120):
        raise AppError(
            "Muitos pedidos. Tente novamente em alguns minutos.",
            "rate_limited",
            status_code=429,
        )

    email_norm = avatar_service.normalize_email(email)
    if not avatar_service.is_valid_email(email_norm):
        raise AppError("E-mail inválido", "invalid_email", status_code=400)

    size = avatar_service.clamp_size(s)
    data, content_type = avatar_service.resolve_avatar(db, email_norm, size)
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )
