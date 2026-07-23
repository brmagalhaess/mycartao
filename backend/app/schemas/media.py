from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

MediaPurpose = Literal["avatar", "portfolio", "print"]


class MediaUploadResponse(BaseModel):
    id: UUID
    url: str = Field(min_length=1)
    purpose: MediaPurpose

    model_config = {"from_attributes": True}
