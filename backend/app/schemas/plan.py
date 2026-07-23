from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    code: str = Field(min_length=2, max_length=40, pattern=r"^[a-z0-9_-]+$")
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    amount_cents: int = Field(ge=0)
    currency: str = Field(default="brl", min_length=3, max_length=10)
    interval: str = Field(default="month", pattern=r"^(month|year)$")
    entitlement: str = Field(default="pro", pattern=r"^(free|pro)$")
    is_active: bool = True
    is_default: bool = False
    sort_order: int = 0
    sync_stripe: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = None
    amount_cents: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)
    interval: Optional[str] = Field(default=None, pattern=r"^(month|year)$")
    entitlement: Optional[str] = Field(default=None, pattern=r"^(free|pro)$")
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None
    sync_stripe: bool = True


class PlanResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    amount_cents: int
    currency: str
    interval: str
    entitlement: str
    stripe_product_id: Optional[str] = None
    stripe_price_id: Optional[str] = None
    is_active: bool
    is_default: bool
    sort_order: int

    model_config = {"from_attributes": True}
