from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models.plan import Plan
from app.models.user import User
from tests.conftest import _auth_client

client = TestClient(app)


def test_public_plans_lists_active_pro():
    db = SessionLocal()
    try:
        db.add(
            Plan(
                code="pro",
                name="Pro",
                amount_cents=1990,
                currency="brl",
                interval="month",
                entitlement="pro",
                stripe_price_id="price_test",
                is_active=True,
                is_default=True,
            )
        )
        db.commit()
    finally:
        db.close()

    r = client.get("/api/v1/billing/plans")
    assert r.status_code == 200
    codes = [p["code"] for p in r.json()]
    assert "pro" in codes


@patch(
    "app.services.stripe_plans.create_product_and_price",
    return_value=("prod_x", "price_x"),
)
def test_admin_can_create_plan(mock_create):
    c = _auth_client("admin-plans@example.com", "admin-plan-tok", "admin")
    r = c.post(
        "/api/v1/admin/plans",
        json={
            "code": "business",
            "name": "Business",
            "amount_cents": 4990,
            "currency": "brl",
            "interval": "month",
            "entitlement": "pro",
            "is_active": True,
            "is_default": False,
            "sync_stripe": True,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["code"] == "business"
    assert body["stripe_price_id"] == "price_x"
    mock_create.assert_called_once()


@patch(
    "app.services.stripe_plans.update_product",
)
@patch(
    "app.services.stripe_plans.create_new_price",
    return_value="price_new",
)
def test_admin_can_update_plan_price(mock_new_price, mock_update_product):
    db = SessionLocal()
    try:
        plan = Plan(
            code="starter",
            name="Starter",
            amount_cents=990,
            currency="brl",
            interval="month",
            entitlement="pro",
            stripe_product_id="prod_old",
            stripe_price_id="price_old",
            is_active=True,
            is_default=False,
        )
        db.add(plan)
        db.commit()
        plan_id = str(plan.id)
    finally:
        db.close()

    c = _auth_client("admin-edit@example.com", "admin-edit-tok", "admin")
    r = c.patch(
        f"/api/v1/admin/plans/{plan_id}",
        json={"amount_cents": 1490, "sync_stripe": True},
    )
    assert r.status_code == 200, r.text
    assert r.json()["amount_cents"] == 1490
    assert r.json()["stripe_price_id"] == "price_new"
    mock_new_price.assert_called_once()


def test_free_cannot_create_plan():
    c = _auth_client("free-plans@example.com", "free-plan-tok", "free")
    r = c.post(
        "/api/v1/admin/plans",
        json={
            "code": "extra",
            "name": "Extra",
            "amount_cents": 100,
            "sync_stripe": False,
        },
    )
    assert r.status_code == 403
