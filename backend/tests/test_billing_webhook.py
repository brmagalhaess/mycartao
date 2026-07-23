from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models.billing import Subscription
from app.models.user import User

client = TestClient(app)


@pytest.fixture
def db_user():
    db = SessionLocal()
    try:
        user = User(email="billing@example.com", plan="free")
        db.add(user)
        db.commit()
        db.refresh(user)
        yield user
    finally:
        db.close()


@patch("app.services.stripe_billing.stripe.Webhook.construct_event")
def test_checkout_completed_upgrades_plan(mock_event, db_user):
    mock_event.return_value = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_1",
                "subscription": "sub_1",
                "metadata": {"user_id": str(db_user.id)},
            }
        },
    }
    r = client.post(
        "/api/v1/billing/webhook",
        content=b"{}",
        headers={"Stripe-Signature": "t"},
    )
    assert r.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == db_user.id).one()
        assert user.plan == "pro"
        assert user.stripe_customer_id == "cus_1"
        sub = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == "sub_1")
            .one()
        )
        assert sub.status == "active"
        assert sub.user_id == user.id
    finally:
        db.close()


@patch("app.services.stripe_billing.stripe.Webhook.construct_event")
def test_subscription_deleted_downgrades_plan(mock_event, db_user):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == db_user.id).one()
        user.plan = "pro"
        user.stripe_customer_id = "cus_1"
        db.add(
            Subscription(
                user_id=user.id,
                stripe_subscription_id="sub_1",
                status="active",
            )
        )
        db.commit()
    finally:
        db.close()

    mock_event.return_value = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_1",
                "customer": "cus_1",
                "status": "canceled",
                "metadata": {"user_id": str(db_user.id)},
            }
        },
    }
    r = client.post(
        "/api/v1/billing/webhook",
        content=b"{}",
        headers={"Stripe-Signature": "t"},
    )
    assert r.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == db_user.id).one()
        assert user.plan == "free"
        sub = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == "sub_1")
            .one()
        )
        assert sub.status == "canceled"
    finally:
        db.close()


@patch("app.services.stripe_billing.stripe.Webhook.construct_event")
def test_subscription_updated_keeps_pro_when_active(mock_event, db_user):
    mock_event.return_value = {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_2",
                "customer": "cus_2",
                "status": "active",
                "current_period_end": 1893456000,
                "metadata": {"user_id": str(db_user.id)},
            }
        },
    }
    r = client.post(
        "/api/v1/billing/webhook",
        content=b"{}",
        headers={"Stripe-Signature": "t"},
    )
    assert r.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == db_user.id).one()
        assert user.plan == "pro"
        sub = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == "sub_2")
            .one()
        )
        assert sub.status == "active"
        assert sub.current_period_end is not None
    finally:
        db.close()


def test_checkout_requires_stripe_config(auth_client_free):
    r = auth_client_free.post("/api/v1/billing/checkout")
    assert r.status_code == 503
    assert r.json()["code"] == "billing_not_configured"


@patch("app.services.stripe_billing.stripe.checkout.Session.create")
@patch("app.services.stripe_billing.stripe.Customer.create")
def test_checkout_returns_url_when_configured(
    mock_customer_create, mock_session_create, auth_client_free, monkeypatch
):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_test_x")
    monkeypatch.setattr(sb.settings, "stripe_price_pro", "price_pro")

    mock_customer_create.return_value = {"id": "cus_new"}
    mock_session_create.return_value = MagicMock(url="https://checkout.stripe.test/s")

    r = auth_client_free.post("/api/v1/billing/checkout")
    assert r.status_code == 200
    assert r.json()["url"] == "https://checkout.stripe.test/s"
    mock_session_create.assert_called_once()
    kwargs = mock_session_create.call_args.kwargs
    assert kwargs["mode"] == "subscription"
    assert kwargs["metadata"]["user_id"]
    assert kwargs["line_items"][0]["price"] == "price_pro"
