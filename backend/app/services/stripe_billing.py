from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import stripe
from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.models.billing import Subscription
from app.models.user import User

ACTIVE_STATUSES = frozenset({"active", "trialing"})


def _require_stripe_api() -> None:
    if not settings.stripe_secret_key or not settings.stripe_price_pro:
        raise AppError(
            "Billing Stripe não configurado",
            "billing_not_configured",
            status_code=503,
        )
    stripe.api_key = settings.stripe_secret_key


def create_checkout_session(db: Session, user: User) -> str:
    """Create a Stripe Checkout Session (subscription) and return its URL."""
    _require_stripe_api()

    customer_id = user.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )
        customer_id = customer["id"] if isinstance(customer, dict) else customer.id
        user.stripe_customer_id = customer_id
        db.commit()

    base = settings.public_app_url.rstrip("/")
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": settings.stripe_price_pro, "quantity": 1}],
        success_url=f"{base}/app/billing?success=1",
        cancel_url=f"{base}/app/billing?canceled=1",
        metadata={"user_id": str(user.id)},
        subscription_data={"metadata": {"user_id": str(user.id)}},
        client_reference_id=str(user.id),
    )
    url = session["url"] if isinstance(session, dict) else session.url
    if not url:
        raise AppError("Falha ao criar sessão Stripe", "checkout_failed", status_code=502)
    return url


def _obj(data: Any) -> dict:
    if isinstance(data, dict):
        return data
    if hasattr(data, "to_dict"):
        return data.to_dict()
    return dict(data)


def _period_end(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromtimestamp(int(raw), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _resolve_user(
    db: Session,
    *,
    user_id: str | None = None,
    customer_id: str | None = None,
    subscription_id: str | None = None,
) -> User | None:
    if user_id:
        try:
            uid = UUID(str(user_id))
        except ValueError:
            return None
        user = db.query(User).filter(User.id == uid).one_or_none()
        if user:
            return user
    if subscription_id:
        sub = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == subscription_id)
            .one_or_none()
        )
        if sub:
            return db.query(User).filter(User.id == sub.user_id).one_or_none()
    if customer_id:
        return (
            db.query(User).filter(User.stripe_customer_id == customer_id).one_or_none()
        )
    return None


def _upsert_subscription(
    db: Session,
    user: User,
    *,
    stripe_subscription_id: str,
    status: str,
    current_period_end: Any = None,
) -> Subscription:
    row = (
        db.query(Subscription)
        .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
        .one_or_none()
    )
    if row is None:
        row = Subscription(
            user_id=user.id,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_end=_period_end(current_period_end),
        )
        db.add(row)
    else:
        row.user_id = user.id
        row.status = status
        row.current_period_end = _period_end(current_period_end)
    return row


def _apply_plan(user: User, status: str) -> None:
    if user.plan == "admin":
        return
    user.plan = "pro" if status in ACTIVE_STATUSES else "free"


def handle_checkout_completed(db: Session, obj: dict) -> None:
    meta = obj.get("metadata") or {}
    user = _resolve_user(
        db,
        user_id=meta.get("user_id") or obj.get("client_reference_id"),
        customer_id=obj.get("customer"),
        subscription_id=obj.get("subscription"),
    )
    if user is None:
        return

    customer_id = obj.get("customer")
    if customer_id:
        user.stripe_customer_id = customer_id

    sub_id = obj.get("subscription")
    if sub_id:
        _upsert_subscription(
            db,
            user,
            stripe_subscription_id=str(sub_id),
            status="active",
        )
    user.plan = "pro" if user.plan != "admin" else user.plan
    db.commit()


def handle_subscription_updated(db: Session, obj: dict) -> None:
    meta = obj.get("metadata") or {}
    sub_id = obj.get("id")
    user = _resolve_user(
        db,
        user_id=meta.get("user_id"),
        customer_id=obj.get("customer"),
        subscription_id=sub_id,
    )
    if user is None or not sub_id:
        return

    customer_id = obj.get("customer")
    if customer_id:
        user.stripe_customer_id = customer_id

    status = str(obj.get("status") or "active")
    _upsert_subscription(
        db,
        user,
        stripe_subscription_id=str(sub_id),
        status=status,
        current_period_end=obj.get("current_period_end"),
    )
    _apply_plan(user, status)
    db.commit()


def handle_subscription_deleted(db: Session, obj: dict) -> None:
    meta = obj.get("metadata") or {}
    sub_id = obj.get("id")
    user = _resolve_user(
        db,
        user_id=meta.get("user_id"),
        customer_id=obj.get("customer"),
        subscription_id=sub_id,
    )
    if user is None:
        return

    if sub_id:
        _upsert_subscription(
            db,
            user,
            stripe_subscription_id=str(sub_id),
            status="canceled",
            current_period_end=obj.get("current_period_end"),
        )
    if user.plan != "admin":
        user.plan = "free"
    db.commit()


def process_webhook_event(db: Session, event: Any) -> None:
    payload = _obj(event)
    event_type = payload.get("type")
    data = payload.get("data") or {}
    obj = _obj(data.get("object") or {})

    if event_type == "checkout.session.completed":
        handle_checkout_completed(db, obj)
    elif event_type == "customer.subscription.updated":
        handle_subscription_updated(db, obj)
    elif event_type == "customer.subscription.deleted":
        handle_subscription_deleted(db, obj)


def construct_and_process_webhook(
    db: Session, payload: bytes, sig_header: str | None
) -> None:
    if not sig_header:
        raise AppError(
            "Cabeçalho Stripe-Signature ausente",
            "invalid_signature",
            status_code=400,
        )
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except Exception as exc:
        raise AppError(
            "Assinatura Stripe inválida",
            "invalid_signature",
            status_code=400,
        ) from exc

    process_webhook_event(db, event)
