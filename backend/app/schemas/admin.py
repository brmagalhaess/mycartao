from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


PlanLiteral = Literal["free", "pro", "admin"]


class AdminUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    plan: str = Field(description="free|pro|admin")

    model_config = {"from_attributes": True}


class AdminPlanUpdate(BaseModel):
    plan: PlanLiteral
