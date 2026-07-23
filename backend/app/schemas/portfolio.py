from __future__ import annotations

from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


PortfolioType = Literal["project", "service"]


class PortfolioCreate(BaseModel):
    type: PortfolioType
    title: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_key: Optional[str] = Field(default=None, max_length=512)
    sort_order: int = 0
    category: Optional[str] = Field(default=None, max_length=80)


class PortfolioUpdate(BaseModel):
    type: Optional[PortfolioType] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_key: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    category: Optional[str] = Field(default=None, max_length=80)


class PortfolioResponse(BaseModel):
    id: UUID
    type: PortfolioType
    title: str
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_key: Optional[str] = None
    sort_order: int = 0
    category: Optional[str] = None

    model_config = {"from_attributes": True}
