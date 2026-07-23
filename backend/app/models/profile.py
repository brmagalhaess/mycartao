from __future__ import annotations

from typing import Optional

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    display_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    headline: Mapped[Optional[str]] = mapped_column(String(240), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    theme: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    brand_color: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    slug: Mapped[Optional[str]] = mapped_column(String(80), unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user = relationship("User", back_populates="profile")
    cards = relationship("Card", back_populates="profile", cascade="all, delete-orphan")
    portfolio_items = relationship(
        "PortfolioItem", back_populates="profile", cascade="all, delete-orphan"
    )
    smart_rules = relationship(
        "SmartRule", back_populates="profile", cascade="all, delete-orphan"
    )
