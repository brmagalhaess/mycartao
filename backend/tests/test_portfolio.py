from __future__ import annotations


def _item(title: str, typ: str = "project", **extra):
    payload = {"type": typ, "title": title}
    payload.update(extra)
    return payload


def test_free_portfolio_limit(auth_client_free):
    for i in range(3):
        r = auth_client_free.post("/api/v1/portfolio", json=_item(f"Item {i}"))
        assert r.status_code == 201, r.text

    r = auth_client_free.post("/api/v1/portfolio", json=_item("Item 4"))
    assert r.status_code == 403
    assert r.json()["code"] == "portfolio_limit_reached"


def test_pro_can_create_beyond_free_limit(auth_client_pro):
    for i in range(4):
        r = auth_client_pro.post("/api/v1/portfolio", json=_item(f"Pro {i}"))
        assert r.status_code == 201, r.text


def test_portfolio_crud_and_service_price(auth_client_pro):
    created = auth_client_pro.post(
        "/api/v1/portfolio",
        json=_item(
            "Consultoria",
            typ="service",
            description="1h",
            price="150.00",
            category="servicos",
            sort_order=1,
        ),
    )
    assert created.status_code == 201
    item = created.json()
    item_id = item["id"]
    assert item["type"] == "service"
    assert item["title"] == "Consultoria"
    assert float(item["price"]) == 150.0

    listed = auth_client_pro.get("/api/v1/portfolio")
    assert listed.status_code == 200
    assert any(x["id"] == item_id for x in listed.json())

    got = auth_client_pro.get(f"/api/v1/portfolio/{item_id}")
    assert got.status_code == 200
    assert got.json()["id"] == item_id

    patched = auth_client_pro.patch(
        f"/api/v1/portfolio/{item_id}",
        json={"title": "Consultoria Pro", "price": "200.50"},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Consultoria Pro"
    assert float(patched.json()["price"]) == 200.5

    deleted = auth_client_pro.delete(f"/api/v1/portfolio/{item_id}")
    assert deleted.status_code == 204
    assert auth_client_pro.get(f"/api/v1/portfolio/{item_id}").status_code == 404


def test_public_portfolio_by_slug(auth_client_pro):
    assert auth_client_pro.patch("/api/v1/me/slug", json={"slug": "bruno-port"}).status_code == 200
    created = auth_client_pro.post(
        "/api/v1/portfolio",
        json=_item("Projeto A", typ="project", description="demo"),
    ).json()

    r = auth_client_pro.get("/api/v1/public/portfolio/bruno-port")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert any(x["id"] == created["id"] for x in body)
    assert any(x["title"] == "Projeto A" for x in body)


def test_public_portfolio_by_profile_id(auth_client_free):
    profile = auth_client_free.get("/api/v1/me").json()
    created = auth_client_free.post(
        "/api/v1/portfolio",
        json=_item("Free Project"),
    ).json()

    r = auth_client_free.get(f"/api/v1/public/portfolio/{profile['id']}")
    assert r.status_code == 200
    assert any(x["id"] == created["id"] for x in r.json())


def test_public_portfolio_not_found():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/v1/public/portfolio/does-not-exist")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found"
