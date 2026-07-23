from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services import stripe_billing

router = APIRouter()


@router.post("/checkout")
def create_checkout(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = stripe_billing.create_checkout_session(db, user)
    return {"url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("Stripe-Signature")
    stripe_billing.construct_and_process_webhook(db, payload, sig)
    return {"received": True}
