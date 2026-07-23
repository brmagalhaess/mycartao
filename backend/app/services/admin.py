from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.user import User
from app.schemas.admin import AdminPlanUpdate

VALID_PLANS = frozenset({"free", "pro", "admin"})


def require_admin(user: User) -> None:
    if user.plan != "admin":
        raise AppError(
            "Acesso restrito a administradores",
            "admin_required",
            status_code=403,
        )


def list_users(db: Session, actor: User) -> List[User]:
    require_admin(actor)
    return db.query(User).order_by(User.created_at.asc()).all()


def update_user_plan(
    db: Session, actor: User, user_id: UUID, data: AdminPlanUpdate
) -> User:
    require_admin(actor)
    if data.plan not in VALID_PLANS:
        raise AppError("Plano inválido", "invalid_plan", status_code=400)

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if user is None:
        raise AppError("Usuário não encontrado", "not_found", status_code=404)

    user.plan = data.plan
    db.commit()
    db.refresh(user)
    return user
