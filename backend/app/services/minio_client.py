from __future__ import annotations

import json
from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.config import settings

ALLOWED_MIME = frozenset({"image/jpeg", "image/png", "image/webp"})
MAX_BYTES = 5 * 1024 * 1024  # 5MB

_PUBLIC_READ_POLICY = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{settings.minio_bucket}/*"],
        }
    ],
}


def get_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
    )


def ensure_bucket() -> None:
    """Create bucket (and public-read policy) if missing. Safe to call on startup."""
    client = get_client()
    bucket = settings.minio_bucket
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    try:
        client.set_bucket_policy(bucket, json.dumps(_PUBLIC_READ_POLICY))
    except S3Error:
        # Policy may already exist or be managed externally.
        pass


def public_url(bucket_key: str) -> str:
    """Same-origin path served by the API (never expose MinIO host to browsers)."""
    key = bucket_key.lstrip("/")
    return f"/api/v1/media/files/{key}"


def open_object(bucket_key: str):
    """Return a MinIO object response, or None if missing."""
    client = get_client()
    try:
        return client.get_object(settings.minio_bucket, bucket_key)
    except S3Error as exc:
        if exc.code in {"NoSuchKey", "NoSuchBucket", "NoSuchObject"}:
            return None
        raise


def upload_bytes(bucket_key: str, data: bytes, content_type: str) -> str:
    """Put object in MinIO and return a same-origin media URL."""
    client = get_client()
    client.put_object(
        settings.minio_bucket,
        bucket_key,
        BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return public_url(bucket_key)
