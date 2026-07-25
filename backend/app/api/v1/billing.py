from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.plan import PlanResponse
from app.services import plans as plans_service
from app.services import stripe_billing

router = APIRouter()


class CheckoutBody(BaseModel):
    plan_id: Optional[UUID] = None


@router.get("/status")
def billing_status():
    """Public-ish status for UI (no secrets). Auth optional not required."""
    return {
        "environment": "production" if settings.is_production() else "development",
        "stripe_mode": settings.stripe_mode(),
    }


@router.get("/plans", response_model=List[PlanResponse])
def public_plans(db: Session = Depends(get_db)):
    return plans_service.list_plans(db, active_only=True)


@router.post("/checkout")
def create_checkout(
    body: Optional[CheckoutBody] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_id = body.plan_id if body else None
    url = stripe_billing.create_checkout_session(db, user, plan_id=plan_id)
    return {"url": url}


@router.get("/subscription")
def subscription_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return stripe_billing.get_subscription_overview(db, user)


@router.post("/cancel")
def cancel_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return stripe_billing.cancel_subscription(db, user)


@router.post("/resume")
def resume_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return stripe_billing.resume_subscription(db, user)


@router.get("/history")
def billing_history(user: User = Depends(get_current_user)):
    return {"invoices": stripe_billing.list_invoices(user)}


@router.post("/sync")
def sync_billing(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reconcile plan from Stripe — fallback when a webhook was missed."""
    plan = stripe_billing.sync_subscription_from_stripe(db, user)
    return {"plan": plan}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("Stripe-Signature")
    stripe_billing.construct_and_process_webhook(db, payload, sig)
    return {"received": True}
