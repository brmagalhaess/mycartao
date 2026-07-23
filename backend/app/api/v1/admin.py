from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.admin import AdminPlanUpdate, AdminUserResponse
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.services import admin as admin_service
from app.services import plans as plans_service

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


@router.get("/plans", response_model=List[PlanResponse])
def list_admin_plans(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.plan != "admin":
        from app.core.errors import AppError

        raise AppError("Acesso admin necessário", "forbidden", status_code=403)
    return plans_service.list_plans(db)


@router.post("/plans", response_model=PlanResponse, status_code=201)
def create_admin_plan(
    body: PlanCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return plans_service.create_plan(db, user, body)


@router.patch("/plans/{plan_id}", response_model=PlanResponse)
def patch_admin_plan(
    plan_id: UUID,
    body: PlanUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return plans_service.update_plan(db, user, plan_id, body)
