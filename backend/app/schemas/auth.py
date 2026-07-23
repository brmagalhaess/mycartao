from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class MagicLinkRequest(BaseModel):
    email: EmailStr


class OkResponse(BaseModel):
    ok: bool = True


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    plan: str = Field(description="free|pro|admin")

    model_config = {"from_attributes": True}
