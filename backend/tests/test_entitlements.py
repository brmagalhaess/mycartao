from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.services.entitlements import entitlements_for, feature_matrix, is_pro


def test_is_pro_and_entitlements_shape():
    assert is_pro("pro")
    assert is_pro("admin")
    assert not is_pro("free")

    free = entitlements_for("free")
    assert free["is_pro"] is False
    assert free["cards"]["limit"] == 1
    assert free["slug"] is False
    assert free["analytics"]["export"] is False
    assert free["analytics"]["max_days"] == 7
    assert free["print"]["watermark"] is True
    assert free["print"]["templates"] == ["classic"]
    assert free["portfolio"]["categories"] is False
    assert free["lead_capture"] is True

    pro = entitlements_for("pro")
    assert pro["is_pro"] is True
    assert pro["cards"]["unlimited"] is True
    assert pro["analytics"]["export"] is True
    assert pro["analytics"]["max_days"] == 90
    assert pro["print"]["watermark"] is False
    assert "compact" in pro["print"]["templates"]
    assert pro["portfolio"]["categories"] is True

    matrix = feature_matrix()
    assert len(matrix["free"]) >= 8
    assert len(matrix["pro"]) >= 8


def test_me_entitlements_endpoint(auth_client_free, auth_client_pro):
    r = auth_client_free.get("/api/v1/me/entitlements")
    assert r.status_code == 200
    body = r.json()
    assert body["plan"] == "free"
    assert body["is_pro"] is False
    assert "matrix" in body
    assert body["analytics"]["export"] is False

    r2 = auth_client_pro.get("/api/v1/me/entitlements")
    assert r2.status_code == 200
    assert r2.json()["is_pro"] is True
    assert r2.json()["analytics"]["export"] is True


def test_analytics_export_pro_only(auth_client_free, auth_client_pro):
    card = auth_client_free.post(
        "/api/v1/cards", json={"title": "Export Free", "fields": {}}
    )
    assert card.status_code == 201
    TestClient(app).get(f"/api/v1/public/cards/{card.json()['id']}")

    denied = auth_client_free.get("/api/v1/analytics/export")
    assert denied.status_code == 403
    assert denied.json()["code"] == "plan_required"

    pro_card = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Export Pro", "fields": {}}
    )
    assert pro_card.status_code == 201
    TestClient(app).get(f"/api/v1/public/cards/{pro_card.json()['id']}")

    ok = auth_client_pro.get("/api/v1/analytics/export", params={"days": 90})
    assert ok.status_code == 200, ok.text
    assert "text/csv" in ok.headers["content-type"]
    assert "day,views" in ok.text


def test_print_template_pro_only(auth_client_free, auth_client_pro):
    free_card = auth_client_free.post(
        "/api/v1/cards", json={"title": "Print Free", "fields": {}}
    ).json()["id"]

    denied = auth_client_free.get(
        f"/api/v1/cards/{free_card}/print.pdf", params={"template": "compact"}
    )
    assert denied.status_code == 403
    assert denied.json()["code"] == "print_template_plan_required"

    classic = auth_client_free.get(
        f"/api/v1/cards/{free_card}/print.pdf", params={"template": "classic"}
    )
    assert classic.status_code == 200
    assert classic.content[:4] == b"%PDF"

    pro_card = auth_client_pro.post(
        "/api/v1/cards", json={"title": "Print Pro", "fields": {}}
    ).json()["id"]
    for tpl in ("classic", "compact", "bold"):
        r = auth_client_pro.get(
            f"/api/v1/cards/{pro_card}/print.pdf", params={"template": tpl}
        )
        assert r.status_code == 200, tpl
        assert r.content[:4] == b"%PDF"


def test_portfolio_category_pro_only(auth_client_free, auth_client_pro):
    denied = auth_client_free.post(
        "/api/v1/portfolio",
        json={"type": "project", "title": "Com categoria", "category": "web"},
    )
    assert denied.status_code == 403
    assert denied.json()["code"] == "portfolio_category_pro_only"

    ok = auth_client_pro.post(
        "/api/v1/portfolio",
        json={"type": "project", "title": "Pro cat", "category": "web"},
    )
    assert ok.status_code == 201
    assert ok.json()["category"] == "web"
