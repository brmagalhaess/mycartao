from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services import analytics as analytics_service

router = APIRouter()


@router.get("/summary")
def analytics_summary(
    days: int = Query(7, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics_service.summary(db, user, days)
