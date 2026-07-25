from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: UUID
    display_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_key: Optional[str] = None
    theme: Optional[str] = None
    brand_color: Optional[str] = None
    slug: Optional[str] = None
    lead_capture_enabled: bool = True

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=120)
    headline: Optional[str] = Field(default=None, max_length=240)
    bio: Optional[str] = None
    theme: Optional[str] = Field(default=None, max_length=64)
    brand_color: Optional[str] = Field(default=None, max_length=32)
    lead_capture_enabled: Optional[bool] = None


class SlugUpdate(BaseModel):
    """Pass a string to set; pass null to clear the personalized slug."""

    slug: Optional[str] = None
