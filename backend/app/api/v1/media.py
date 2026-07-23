from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db import get_db
from app.deps import get_current_user
from app.models.media import MediaAsset
from app.models.user import User
from app.schemas.media import MediaUploadResponse
from app.services import minio_client

router = APIRouter()

ALLOWED_PURPOSES = frozenset({"avatar", "portfolio", "print"})
PRO_PLANS = frozenset({"pro", "admin"})


@router.post(
    "/upload",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_media(
    file: UploadFile = File(...),
    purpose: Literal["avatar", "portfolio", "print"] = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if purpose not in ALLOWED_PURPOSES:
        raise AppError("purpose inválido", "invalid_purpose", status_code=400)

    content_type = (file.content_type or "").lower()
    if content_type not in minio_client.ALLOWED_MIME:
        raise AppError(
            "MIME não permitido (jpeg/png/webp)",
            "invalid_mime",
            status_code=400,
        )

    data = await file.read()
    if len(data) > minio_client.MAX_BYTES:
        raise AppError("Arquivo excede 5MB", "file_too_large", status_code=400)
    if not data:
        raise AppError("Arquivo vazio", "empty_file", status_code=400)

    if purpose == "avatar" and user.plan not in PRO_PLANS:
        exists = (
            db.query(MediaAsset)
            .filter(MediaAsset.owner_id == user.id, MediaAsset.purpose == "avatar")
            .first()
        )
        if exists is not None:
            raise AppError(
                "Limite de avatar do plano Free atingido",
                "avatar_limit_reached",
                status_code=403,
            )

    ext = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }[content_type]
    asset_id = uuid.uuid4()
    bucket_key = f"{user.id}/{purpose}/{asset_id}.{ext}"

    url = minio_client.upload_bytes(bucket_key, data, content_type)

    asset = MediaAsset(
        id=asset_id,
        owner_id=user.id,
        bucket_key=bucket_key,
        mime=content_type,
        purpose=purpose,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return MediaUploadResponse(id=asset.id, url=url, purpose=asset.purpose)  # type: ignore[arg-type]
