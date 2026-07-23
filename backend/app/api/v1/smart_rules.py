from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.smart_rule import (
    GoRedirectResponse,
    SmartRuleCreate,
    SmartRuleResponse,
    SmartRuleUpdate,
)
from app.services import smart_rules as smart_rules_service

router = APIRouter()
public_router = APIRouter()


@router.get("", response_model=List[SmartRuleResponse])
def list_smart_rules(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return smart_rules_service.list_rules(db, user)


@router.post("", response_model=SmartRuleResponse, status_code=status.HTTP_201_CREATED)
def create_smart_rule(
    body: SmartRuleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return smart_rules_service.create_rule(db, user, body)


@router.get("/{rule_id}", response_model=SmartRuleResponse)
def get_smart_rule(
    rule_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return smart_rules_service.get_rule_for_user(db, user, rule_id)


@router.patch("/{rule_id}", response_model=SmartRuleResponse)
def patch_smart_rule(
    rule_id: UUID,
    body: SmartRuleUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return smart_rules_service.update_rule(db, user, rule_id, body)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_smart_rule(
    rule_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    smart_rules_service.delete_rule(db, user, rule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.get("/{slug_or_id}", response_model=GoRedirectResponse)
def public_go(slug_or_id: str, db: Session = Depends(get_db)):
    return smart_rules_service.resolve_go(db, slug_or_id)
