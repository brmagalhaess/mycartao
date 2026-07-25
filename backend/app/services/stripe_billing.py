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
    if not settings.stripe_secret_key:
        raise AppError(
            "Billing Stripe não configurado",
            "billing_not_configured",
            status_code=503,
        )
    if settings.is_production() and settings.stripe_mode() == "test":
        raise AppError(
            "Pagamentos ainda em modo teste. Configure a chave live (sk_live_...) no servidor.",
            "stripe_test_mode",
            status_code=503,
        )
    stripe.api_key = settings.stripe_secret_key


def _resolve_price_id(db: Session, plan_id: UUID | None = None) -> tuple[str, str]:
    """Return (stripe_price_id, plan_code).

    ``STRIPE_PRICE_PRO`` (env) wins over a stale DB price so Live cutover
    works even if ``plans.stripe_price_id`` still points at a test Price.
    """
    from app.services import plans as plans_service

    plan = None
    if plan_id:
        plan = plans_service.get_plan(db, plan_id)
        if not plan.is_active:
            raise AppError(
                "Plano indisponível para checkout",
                "plan_unavailable",
                status_code=400,
            )
    else:
        plan = plans_service.get_default_checkout_plan(db)

    if settings.stripe_price_pro:
        return settings.stripe_price_pro, (plan.code if plan else "pro")

    if plan and plan.stripe_price_id:
        return plan.stripe_price_id, plan.code

    raise AppError(
        "Nenhum preço Stripe configurado",
        "billing_not_configured",
        status_code=503,
    )


def _ensure_customer(db: Session, user: User) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id
    customer = stripe.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id)},
    )
    customer_id = customer["id"] if isinstance(customer, dict) else customer.id
    user.stripe_customer_id = customer_id
    db.commit()
    return str(customer_id)


def _create_session(user: User, price_id: str, plan_code: str, customer_id: str):
    base = settings.public_app_url.rstrip("/")
    return stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{base}/app/billing?success=1",
        cancel_url=f"{base}/app/billing?canceled=1",
        metadata={"user_id": str(user.id), "plan_code": plan_code},
        subscription_data={
            "metadata": {"user_id": str(user.id), "plan_code": plan_code}
        },
        client_reference_id=str(user.id),
    )


def _stripe_error_message(exc: Exception) -> str:
    msg = getattr(exc, "user_message", None) or getattr(exc, "message", None) or str(exc)
    text = str(msg).strip() or "Erro na Stripe"
    # Keep UI readable; Stripe messages can be long.
    return text[:280]


def create_checkout_session(
    db: Session, user: User, plan_id: UUID | None = None
) -> str:
    """Create a Stripe Checkout Session (subscription) and return its URL."""
    _require_stripe_api()
    price_id, plan_code = _resolve_price_id(db, plan_id)

    try:
        customer_id = _ensure_customer(db, user)
        try:
            session = _create_session(user, price_id, plan_code, customer_id)
        except stripe.InvalidRequestError as exc:
            # Common after Test → Live: customer_id was created with sk_test_.
            err = _stripe_error_message(exc).lower()
            if user.stripe_customer_id and "no such customer" in err:
                user.stripe_customer_id = None
                db.commit()
                customer_id = _ensure_customer(db, user)
                session = _create_session(user, price_id, plan_code, customer_id)
            else:
                raise
    except stripe.StripeError as exc:
        raise AppError(
            _stripe_error_message(exc),
            "checkout_failed",
            status_code=502,
        ) from exc

    url = session["url"] if isinstance(session, dict) else session.url
    if not url:
        raise AppError("Falha ao criar sessão Stripe", "checkout_failed", status_code=502)
    return url


def _current_subscription_row(db: Session, user: User) -> Subscription | None:
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id)
        .order_by(Subscription.current_period_end.desc().nullslast())
        .first()
    )


def get_subscription_overview(db: Session, user: User) -> dict:
    """Current subscription state for the billing center UI."""
    row = _current_subscription_row(db, user)
    overview: dict = {
        "plan": user.plan,
        "status": row.status if row else None,
        "current_period_end": (
            row.current_period_end.isoformat()
            if row and row.current_period_end
            else None
        ),
        "cancel_at_period_end": False,
        "has_subscription": row is not None,
    }
    if row is None or not settings.stripe_secret_key:
        return overview
    try:
        stripe.api_key = settings.stripe_secret_key
        live = _obj(stripe.Subscription.retrieve(row.stripe_subscription_id))
        overview["status"] = str(live.get("status") or overview["status"])
        overview["cancel_at_period_end"] = bool(live.get("cancel_at_period_end"))
        period_end = _period_end(live.get("current_period_end"))
        if period_end:
            overview["current_period_end"] = period_end.isoformat()
    except stripe.StripeError:
        # DB snapshot is good enough when Stripe is unreachable.
        pass
    return overview


def cancel_subscription(db: Session, user: User) -> dict:
    """Cancel at period end (Pro stays active until the paid period ends)."""
    _require_stripe_api()
    row = _current_subscription_row(db, user)
    if row is None:
        raise AppError(
            "Nenhuma assinatura ativa para cancelar",
            "no_subscription",
            status_code=404,
        )
    try:
        stripe.Subscription.modify(
            row.stripe_subscription_id, cancel_at_period_end=True
        )
    except stripe.StripeError as exc:
        raise AppError(
            _stripe_error_message(exc), "cancel_failed", status_code=502
        ) from exc
    return get_subscription_overview(db, user)


def resume_subscription(db: Session, user: User) -> dict:
    """Undo a scheduled cancellation before the period ends."""
    _require_stripe_api()
    row = _current_subscription_row(db, user)
    if row is None:
        raise AppError(
            "Nenhuma assinatura para retomar",
            "no_subscription",
            status_code=404,
        )
    try:
        stripe.Subscription.modify(
            row.stripe_subscription_id, cancel_at_period_end=False
        )
    except stripe.StripeError as exc:
        raise AppError(
            _stripe_error_message(exc), "resume_failed", status_code=502
        ) from exc
    return get_subscription_overview(db, user)


def list_invoices(user: User, limit: int = 12) -> list[dict]:
    """Billing history straight from Stripe (no local invoice storage)."""
    if not user.stripe_customer_id or not settings.stripe_secret_key:
        return []
    stripe.api_key = settings.stripe_secret_key
    try:
        result = stripe.Invoice.list(customer=user.stripe_customer_id, limit=limit)
    except stripe.StripeError as exc:
        raise AppError(
            _stripe_error_message(exc), "invoices_failed", status_code=502
        ) from exc
    data = result.get("data", []) if isinstance(result, dict) else list(result.data)
    invoices = []
    for raw in data:
        inv = _obj(raw)
        created = _period_end(inv.get("created"))
        invoices.append(
            {
                "id": inv.get("id"),
                "number": inv.get("number"),
                "status": inv.get("status"),
                "amount_paid": inv.get("amount_paid"),
                "currency": inv.get("currency"),
                "created": created.isoformat() if created else None,
                "hosted_invoice_url": inv.get("hosted_invoice_url"),
                "invoice_pdf": inv.get("invoice_pdf"),
            }
        )
    return invoices


def sync_subscription_from_stripe(db: Session, user: User) -> str:
    """Reconcile the user's plan straight from Stripe.

    Fallback for missed webhooks (e.g. endpoint misconfigured at payment time).
    Returns the resulting plan.
    """
    _require_stripe_api()
    if not user.stripe_customer_id:
        return user.plan

    try:
        subs = stripe.Subscription.list(
            customer=user.stripe_customer_id, status="all", limit=10
        )
    except stripe.StripeError as exc:
        raise AppError(
            _stripe_error_message(exc), "billing_sync_failed", status_code=502
        ) from exc

    data = subs.get("data", []) if isinstance(subs, dict) else list(subs.data)
    best: dict | None = None
    for raw in data:
        obj = _obj(raw)
        if obj.get("status") in ACTIVE_STATUSES:
            best = obj
            break
        if best is None:
            best = obj
    if best is None or not best.get("id"):
        return user.plan

    status = str(best.get("status") or "")
    meta = best.get("metadata") or {}
    _upsert_subscription(
        db,
        user,
        stripe_subscription_id=str(best["id"]),
        status=status,
        current_period_end=best.get("current_period_end"),
    )
    _apply_plan(user, status, plan_code=meta.get("plan_code"))
    db.commit()
    return user.plan


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


def _apply_plan(user: User, status: str, plan_code: str | None = None) -> None:
    if user.plan == "admin":
        return
    if status in ACTIVE_STATUSES:
        user.plan = plan_code or "pro"
    else:
        user.plan = "free"


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
    if user.plan != "admin":
        user.plan = str(meta.get("plan_code") or "pro")
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
    _apply_plan(user, status, plan_code=meta.get("plan_code"))
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
