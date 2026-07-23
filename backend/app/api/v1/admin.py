from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.admin import AdminPlanUpdate, AdminUserResponse
from app.services import admin as admin_service

router = APIRouter()


@router.get("/users", response_model=List[AdminUserResponse])
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return admin_service.list_users(db, user)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def patch_user_plan(
    user_id: UUID,
    body: AdminPlanUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return admin_service.update_user_plan(db, user, user_id, body)
