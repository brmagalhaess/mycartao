from __future__ import annotations

import uuid
from typing import List, Literal

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db import get_db
from app.deps import get_current_user
from app.models.media import MediaAsset
from app.models.profile import Profile
from app.models.user import User
from app.schemas.media import MediaUploadResponse
from app.services import minio_client
from app.services.entitlements import is_pro

router = APIRouter()

ALLOWED_PURPOSES = frozenset({"avatar", "portfolio", "print"})


@router.get("", response_model=List[MediaUploadResponse])
def list_media(
    purpose: Literal["avatar", "portfolio", "print"] = Query("avatar"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pro avatar gallery (and other purposes). Free may list current assets too."""
    if purpose == "avatar" and not is_pro(user.plan):
        # Free: at most the active profile avatar as a single-item list.
        profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
        if profile is None or not profile.avatar_key:
            return []
        asset = (
            db.query(MediaAsset)
            .filter(
                MediaAsset.owner_id == user.id,
                MediaAsset.bucket_key == profile.avatar_key,
            )
            .one_or_none()
        )
        if asset is None:
            return []
        return [
            MediaUploadResponse(
                id=asset.id,
                url=minio_client.public_url(asset.bucket_key),
                purpose=asset.purpose,  # type: ignore[arg-type]
            )
        ]

    rows = (
        db.query(MediaAsset)
        .filter(MediaAsset.owner_id == user.id, MediaAsset.purpose == purpose)
        .order_by(MediaAsset.created_at.desc())
        .limit(40)
        .all()
    )
    return [
        MediaUploadResponse(
            id=row.id,
            url=minio_client.public_url(row.bucket_key),
            purpose=row.purpose,  # type: ignore[arg-type]
        )
        for row in rows
    ]


@router.get("/files/{bucket_key:path}")
def serve_media_file(bucket_key: str):
    """Proxy MinIO objects on the API host (same-origin for browsers)."""
    if not bucket_key or ".." in bucket_key or bucket_key.startswith("/"):
        raise AppError("Chave inválida", "invalid_key", status_code=400)

    obj = minio_client.open_object(bucket_key)
    if obj is None:
        raise AppError("Arquivo não encontrado", "not_found", status_code=404)

    content_type = obj.headers.get("Content-Type") or "application/octet-stream"

    def iterfile():
        try:
            yield from obj.stream(32 * 1024)
        finally:
            obj.close()
            obj.release_conn()

    return StreamingResponse(
        iterfile(),
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


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

    # Avatar is free for all plans (including replace). Free keeps one active
    # avatar_key on the profile; Pro may accumulate uploads as a simple gallery.
    if purpose == "avatar" and not is_pro(user.plan):
        old_assets = (
            db.query(MediaAsset)
            .filter(MediaAsset.owner_id == user.id, MediaAsset.purpose == "avatar")
            .all()
        )
        for old in old_assets:
            db.delete(old)

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

    if purpose == "avatar":
        profile = db.query(Profile).filter(Profile.user_id == user.id).one_or_none()
        if profile is not None:
            profile.avatar_key = bucket_key

    db.commit()
    db.refresh(asset)

    return MediaUploadResponse(id=asset.id, url=url, purpose=asset.purpose)  # type: ignore[arg-type]
