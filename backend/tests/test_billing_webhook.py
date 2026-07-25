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


@patch("app.services.stripe_billing.stripe.checkout.Session.create")
@patch("app.services.stripe_billing.stripe.Customer.create")
def test_checkout_env_price_overrides_stale_db_price(
    mock_customer_create, mock_session_create, auth_client_free, monkeypatch
):
    from app.db import SessionLocal
    from app.services import plans as plans_service
    from app.services import stripe_billing as sb

    db = SessionLocal()
    try:
        plans_service.ensure_pro_plan(db, stripe_price_id="price_test_old")
    finally:
        db.close()

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")
    monkeypatch.setattr(sb.settings, "stripe_price_pro", "price_live_new")
    monkeypatch.setattr(sb.settings, "public_app_url", "https://example.com")

    mock_customer_create.return_value = {"id": "cus_live"}
    mock_session_create.return_value = MagicMock(url="https://checkout.stripe.com/s")

    r = auth_client_free.post("/api/v1/billing/checkout")
    assert r.status_code == 200
    assert mock_session_create.call_args.kwargs["line_items"][0]["price"] == (
        "price_live_new"
    )


@patch("app.services.stripe_billing.stripe.checkout.Session.create")
@patch("app.services.stripe_billing.stripe.Customer.create")
def test_checkout_retries_when_test_customer_missing_in_live(
    mock_customer_create, mock_session_create, auth_client_free, monkeypatch
):
    import stripe
    from app.db import SessionLocal
    from app.models.user import User
    from app.services import stripe_billing as sb

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "free@example.com").one()
        user.stripe_customer_id = "cus_test_stale"
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")
    monkeypatch.setattr(sb.settings, "stripe_price_pro", "price_live")
    monkeypatch.setattr(sb.settings, "public_app_url", "https://example.com")

    mock_customer_create.return_value = {"id": "cus_live_new"}
    mock_session_create.side_effect = [
        stripe.InvalidRequestError("No such customer: 'cus_test_stale'", param="customer"),
        MagicMock(url="https://checkout.stripe.com/ok"),
    ]

    r = auth_client_free.post("/api/v1/billing/checkout")
    assert r.status_code == 200
    assert r.json()["url"] == "https://checkout.stripe.com/ok"
    assert mock_session_create.call_count == 2
    assert mock_customer_create.called


@patch("app.services.stripe_billing.stripe.Subscription.list")
def test_sync_upgrades_plan_from_active_subscription(
    mock_sub_list, auth_client_free, monkeypatch
):
    from app.db import SessionLocal
    from app.models.user import User
    from app.services import stripe_billing as sb

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "free@example.com").one()
        user.stripe_customer_id = "cus_live"
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")

    mock_sub_list.return_value = {
        "data": [
            {
                "id": "sub_live_1",
                "status": "active",
                "customer": "cus_live",
                "current_period_end": 1893456000,
                "metadata": {"plan_code": "pro", "user_id": "x"},
            }
        ]
    }

    r = auth_client_free.post("/api/v1/billing/sync")
    assert r.status_code == 200
    assert r.json()["plan"] == "pro"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "free@example.com").one()
        assert user.plan == "pro"
    finally:
        db.close()


def test_sync_without_customer_keeps_plan(auth_client_free, monkeypatch):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")

    r = auth_client_free.post("/api/v1/billing/sync")
    assert r.status_code == 200
    assert r.json()["plan"] == "free"


@patch("app.services.stripe_billing.stripe.Subscription.list")
def test_sync_canceled_subscription_downgrades(
    mock_sub_list, auth_client_pro, monkeypatch
):
    from app.db import SessionLocal
    from app.models.user import User
    from app.services import stripe_billing as sb

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "pro@example.com").one()
        user.stripe_customer_id = "cus_live2"
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")

    mock_sub_list.return_value = {
        "data": [
            {
                "id": "sub_live_2",
                "status": "canceled",
                "customer": "cus_live2",
                "metadata": {},
            }
        ]
    }

    r = auth_client_pro.post("/api/v1/billing/sync")
    assert r.status_code == 200
    assert r.json()["plan"] == "free"


def _set_subscription(email: str, sub_id: str, status: str = "active"):
    from app.db import SessionLocal
    from app.models.billing import Subscription
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one()
        user.stripe_customer_id = "cus_x"
        db.add(
            Subscription(
                user_id=user.id,
                stripe_subscription_id=sub_id,
                status=status,
            )
        )
        db.commit()
    finally:
        db.close()


@patch("app.services.stripe_billing.stripe.Subscription.retrieve")
def test_subscription_overview(mock_retrieve, auth_client_pro, monkeypatch):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    _set_subscription("pro@example.com", "sub_ov1")
    mock_retrieve.return_value = {
        "status": "active",
        "cancel_at_period_end": False,
        "current_period_end": 1893456000,
    }

    r = auth_client_pro.get("/api/v1/billing/subscription")
    assert r.status_code == 200
    body = r.json()
    assert body["plan"] == "pro"
    assert body["status"] == "active"
    assert body["cancel_at_period_end"] is False
    assert body["has_subscription"] is True


@patch("app.services.stripe_billing.stripe.Subscription.retrieve")
@patch("app.services.stripe_billing.stripe.Subscription.modify")
def test_cancel_subscription_at_period_end(
    mock_modify, mock_retrieve, auth_client_pro, monkeypatch
):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    _set_subscription("pro@example.com", "sub_cx1")
    mock_retrieve.return_value = {
        "status": "active",
        "cancel_at_period_end": True,
        "current_period_end": 1893456000,
    }

    r = auth_client_pro.post("/api/v1/billing/cancel")
    assert r.status_code == 200
    assert r.json()["cancel_at_period_end"] is True
    mock_modify.assert_called_once_with("sub_cx1", cancel_at_period_end=True)


def test_cancel_without_subscription_404(auth_client_free, monkeypatch):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    r = auth_client_free.post("/api/v1/billing/cancel")
    assert r.status_code == 404
    assert r.json()["code"] == "no_subscription"


@patch("app.services.stripe_billing.stripe.Invoice.list")
def test_billing_history_lists_invoices(mock_list, auth_client_pro, monkeypatch):
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    _set_subscription("pro@example.com", "sub_hist1")
    mock_list.return_value = {
        "data": [
            {
                "id": "in_1",
                "number": "0001",
                "status": "paid",
                "amount_paid": 1990,
                "currency": "brl",
                "created": 1784943485,
                "hosted_invoice_url": "https://stripe.test/inv",
                "invoice_pdf": "https://stripe.test/inv.pdf",
            }
        ]
    }

    r = auth_client_pro.get("/api/v1/billing/history")
    assert r.status_code == 200
    invoices = r.json()["invoices"]
    assert len(invoices) == 1
    assert invoices[0]["number"] == "0001"
    assert invoices[0]["amount_paid"] == 1990


@patch("app.services.stripe_billing.stripe.checkout.Session.create")
def test_checkout_surfaces_stripe_error(mock_session_create, auth_client_free, monkeypatch):
    import stripe
    from app.services import stripe_billing as sb

    monkeypatch.setattr(sb.settings, "stripe_secret_key", "sk_live_x")
    monkeypatch.setattr(sb.settings, "app_env", "production")
    monkeypatch.setattr(sb.settings, "stripe_price_pro", "price_live")
    monkeypatch.setattr(sb.settings, "public_app_url", "https://example.com")

    # Force customer path with pre-set id so Session.create is hit first.
    from app.db import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "free@example.com").one()
        user.stripe_customer_id = "cus_ok"
        db.commit()
    finally:
        db.close()

    mock_session_create.side_effect = stripe.InvalidRequestError(
        "No such price: 'price_test'", param="line_items[0][price]"
    )

    r = auth_client_free.post("/api/v1/billing/checkout")
    assert r.status_code == 502
    body = r.json()
    assert body["code"] == "checkout_failed"
    assert "price" in body["detail"].lower()
