from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    layout: Optional[str] = Field(default=None, max_length=64)
    fields: Dict[str, Any] = Field(default_factory=dict)
    is_primary: bool = False


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    layout: Optional[str] = Field(default=None, max_length=64)
    fields: Optional[Dict[str, Any]] = None
    is_primary: Optional[bool] = None


class CardResponse(BaseModel):
    id: UUID
    title: str
    layout: Optional[str] = None
    fields: Dict[str, Any] = Field(default_factory=dict)
    is_primary: bool = False

    model_config = {"from_attributes": True}


class PublicCardResponse(CardResponse):
    """Public card plus profile presentation (theme, branding, identity)."""

    display_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    theme: Optional[str] = None
    brand_color: Optional[str] = None
    show_mycartao_branding: bool = True
    lead_capture_enabled: bool = True
