from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate, SlugUpdate
from app.services import profile as profile_service

router = APIRouter()


@router.get("", response_model=ProfileResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return profile_service.get_profile_for_user(db, user)


@router.patch("", response_model=ProfileResponse)
def patch_me(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_service.update_profile(db, user, body)


@router.patch("/slug", response_model=ProfileResponse)
def patch_slug(
    body: SlugUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_service.set_slug(db, user, body.slug)
