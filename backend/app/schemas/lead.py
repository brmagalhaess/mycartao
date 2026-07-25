from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=64)
    message: Optional[str] = Field(default=None, max_length=1000)
    source: str = Field(default="card", max_length=32)


class LeadResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    source: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    leads: List[LeadResponse]
