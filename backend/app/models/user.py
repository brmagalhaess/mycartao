from __future__ import annotations

from typing import Optional

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")  # free|pro|admin
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    profile = relationship("Profile", back_populates="user", uselist=False)
    subscriptions = relationship("Subscription", back_populates="user")
    media_assets = relationship("MediaAsset", back_populates="owner")
