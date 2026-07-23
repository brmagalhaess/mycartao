from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate
from app.services import stripe_plans


def _require_admin(user) -> None:
    if user.plan != "admin":
        raise AppError("Acesso admin necessário", "forbidden", status_code=403)


def list_plans(db: Session, *, active_only: bool = False) -> list[Plan]:
    q = db.query(Plan)
    if active_only:
        q = q.filter(Plan.is_active.is_(True))
    return q.order_by(Plan.sort_order.asc(), Plan.name.asc()).all()


def get_plan(db: Session, plan_id: UUID) -> Plan:
    plan = db.query(Plan).filter(Plan.id == plan_id).one_or_none()
    if plan is None:
        raise AppError("Plano não encontrado", "not_found", status_code=404)
    return plan


def get_default_checkout_plan(db: Session) -> Plan | None:
    plan = (
        db.query(Plan)
        .filter(
            Plan.is_active.is_(True),
            Plan.is_default.is_(True),
            Plan.stripe_price_id.isnot(None),
        )
        .order_by(Plan.sort_order.asc())
        .first()
    )
    if plan:
        return plan
    return (
        db.query(Plan)
        .filter(Plan.is_active.is_(True), Plan.stripe_price_id.isnot(None))
        .order_by(Plan.sort_order.asc())
        .first()
    )


def _clear_other_defaults(db: Session, keep_id: UUID | None = None) -> None:
    q = db.query(Plan).filter(Plan.is_default.is_(True))
    if keep_id:
        q = q.filter(Plan.id != keep_id)
    for row in q.all():
        row.is_default = False


def create_plan(db: Session, admin_user, body: PlanCreate) -> Plan:
    _require_admin(admin_user)
    code = body.code.strip().lower()
    if db.query(Plan).filter(Plan.code == code).one_or_none():
        raise AppError("Código de plano já existe", "plan_code_exists", status_code=400)

    plan = Plan(
        code=code,
        name=body.name.strip(),
        description=body.description,
        amount_cents=body.amount_cents,
        currency=body.currency.lower(),
        interval=body.interval,
        entitlement=body.entitlement,
        is_active=body.is_active,
        is_default=body.is_default,
        sort_order=body.sort_order,
    )
    if body.is_default:
        _clear_other_defaults(db)

    if body.sync_stripe and body.amount_cents > 0:
        product_id, price_id = stripe_plans.create_product_and_price(plan)
        plan.stripe_product_id = product_id
        plan.stripe_price_id = price_id

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update_plan(db: Session, admin_user, plan_id: UUID, body: PlanUpdate) -> Plan:
    _require_admin(admin_user)
    plan = get_plan(db, plan_id)

    if body.name is not None:
        plan.name = body.name.strip()
    if body.description is not None:
        plan.description = body.description
    if body.entitlement is not None:
        plan.entitlement = body.entitlement
    if body.is_active is not None:
        plan.is_active = body.is_active
    if body.sort_order is not None:
        plan.sort_order = body.sort_order
    if body.is_default is not None:
        plan.is_default = body.is_default
        if body.is_default:
            _clear_other_defaults(db, keep_id=plan.id)

    price_changed = False
    if body.amount_cents is not None and body.amount_cents != plan.amount_cents:
        plan.amount_cents = body.amount_cents
        price_changed = True
    if body.currency is not None and body.currency.lower() != plan.currency:
        plan.currency = body.currency.lower()
        price_changed = True
    if body.interval is not None and body.interval != plan.interval:
        plan.interval = body.interval
        price_changed = True

    if body.sync_stripe:
        if not plan.stripe_product_id and plan.amount_cents > 0:
            product_id, price_id = stripe_plans.create_product_and_price(plan)
            plan.stripe_product_id = product_id
            plan.stripe_price_id = price_id
        elif plan.stripe_product_id:
            stripe_plans.update_product(plan)
            if price_changed and plan.amount_cents > 0:
                plan.stripe_price_id = stripe_plans.create_new_price(plan)

    db.commit()
    db.refresh(plan)
    return plan


def ensure_pro_plan(
    db: Session,
    *,
    stripe_product_id: str | None = None,
    stripe_price_id: str | None = None,
) -> Plan:
    """Idempotent seed for MyCartao Pro R$19,90."""
    existing = db.query(Plan).filter(Plan.code == "pro").one_or_none()
    if existing:
        if stripe_price_id and not existing.stripe_price_id:
            existing.stripe_price_id = stripe_price_id
        if stripe_product_id and not existing.stripe_product_id:
            existing.stripe_product_id = stripe_product_id
        if not existing.is_default:
            _clear_other_defaults(db, keep_id=existing.id)
            existing.is_default = True
        db.commit()
        db.refresh(existing)
        return existing

    plan = Plan(
        code="pro",
        name="Pro",
        description="Slug custom, analytics 90 dias, portfólio ilimitado e Smart Card",
        amount_cents=1990,
        currency="brl",
        interval="month",
        entitlement="pro",
        stripe_product_id=stripe_product_id,
        stripe_price_id=stripe_price_id or settings.stripe_price_pro or None,
        is_active=True,
        is_default=True,
        sort_order=10,
    )
    _clear_other_defaults(db)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
