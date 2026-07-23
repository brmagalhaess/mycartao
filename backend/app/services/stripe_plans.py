from __future__ import annotations

import stripe

from app.config import settings
from app.core.errors import AppError
from app.models.plan import Plan


def _api() -> None:
    if not settings.stripe_secret_key:
        raise AppError(
            "Stripe não configurado",
            "billing_not_configured",
            status_code=503,
        )
    stripe.api_key = settings.stripe_secret_key


def create_product_and_price(plan: Plan) -> tuple[str, str]:
    _api()
    product = stripe.Product.create(
        name=f"MyCartao {plan.name}",
        description=plan.description or plan.name,
        metadata={"code": plan.code, "entitlement": plan.entitlement},
    )
    product_id = product["id"] if isinstance(product, dict) else product.id
    price = stripe.Price.create(
        product=product_id,
        unit_amount=plan.amount_cents,
        currency=plan.currency,
        recurring={"interval": plan.interval},
        nickname=f"{plan.name} {plan.interval}",
        metadata={"code": plan.code},
    )
    price_id = price["id"] if isinstance(price, dict) else price.id
    return str(product_id), str(price_id)


def update_product(plan: Plan) -> None:
    if not plan.stripe_product_id:
        return
    _api()
    stripe.Product.modify(
        plan.stripe_product_id,
        name=f"MyCartao {plan.name}",
        description=plan.description or plan.name,
        active=plan.is_active,
        metadata={"code": plan.code, "entitlement": plan.entitlement},
    )


def create_new_price(plan: Plan) -> str:
    """Stripe prices are immutable — create a new price and optionally archive old."""
    if not plan.stripe_product_id:
        raise AppError("Plano sem product Stripe", "stripe_product_missing", status_code=400)
    _api()
    if plan.stripe_price_id:
        try:
            stripe.Price.modify(plan.stripe_price_id, active=False)
        except Exception:
            pass
    price = stripe.Price.create(
        product=plan.stripe_product_id,
        unit_amount=plan.amount_cents,
        currency=plan.currency,
        recurring={"interval": plan.interval},
        nickname=f"{plan.name} {plan.interval}",
        metadata={"code": plan.code},
    )
    return str(price["id"] if isinstance(price, dict) else price.id)
