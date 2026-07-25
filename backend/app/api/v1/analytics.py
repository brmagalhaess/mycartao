from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
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


@router.get("/export")
def analytics_export(
    days: int = Query(90, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    csv_body = analytics_service.export_csv(db, user, days)
    return Response(
        content=csv_body,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="mycartao-analytics.csv"'
        },
    )
