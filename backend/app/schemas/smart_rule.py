from __future__ import annotations

from typing import Any, Dict, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


SmartTarget = Literal["card", "portfolio", "whatsapp"]


class SmartRuleCreate(BaseModel):
    conditions: Dict[str, Any] = Field(default_factory=dict)
    target: SmartTarget


class SmartRuleUpdate(BaseModel):
    conditions: Optional[Dict[str, Any]] = None
    target: Optional[SmartTarget] = None


class SmartRuleResponse(BaseModel):
    id: UUID
    conditions: Dict[str, Any]
    target: SmartTarget

    model_config = {"from_attributes": True}


class GoRedirectResponse(BaseModel):
    target: SmartTarget
    url: str
