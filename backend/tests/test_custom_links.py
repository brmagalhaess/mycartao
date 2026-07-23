from __future__ import annotations


def test_free_cannot_save_custom_links(auth_client_free):
    created = auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_free.patch(
        f"/api/v1/cards/{created['id']}",
        json={
            "fields": {
                "custom_links": [
                    {"id": "1", "title": "Site", "url": "https://example.com", "sort": 0}
                ]
            }
        },
    )
    assert r.status_code == 403
    assert r.json()["code"] == "custom_links_pro_only"


def test_free_cannot_create_with_custom_links(auth_client_free):
    r = auth_client_free.post(
        "/api/v1/cards",
        json={
            "title": "A",
            "fields": {
                "custom_links": [
                    {"id": "1", "title": "Site", "url": "https://example.com", "sort": 0}
                ]
            },
        },
    )
    assert r.status_code == 403
    assert r.json()["code"] == "custom_links_pro_only"


def test_free_can_save_empty_custom_links(auth_client_free):
    created = auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_free.patch(
        f"/api/v1/cards/{created['id']}",
        json={"fields": {"phone": "11999999999", "custom_links": []}},
    )
    assert r.status_code == 200
    assert r.json()["fields"]["phone"] == "11999999999"
    assert r.json()["fields"].get("custom_links") == []


def test_pro_can_save_custom_links(auth_client_pro):
    created = auth_client_pro.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_pro.patch(
        f"/api/v1/cards/{created['id']}",
        json={
            "fields": {
                "custom_links": [
                    {
                        "id": "a1",
                        "title": "Site",
                        "url": "https://example.com",
                        "icon": "globe",
                        "sort": 0,
                    }
                ]
            }
        },
    )
    assert r.status_code == 200
    assert r.json()["fields"]["custom_links"][0]["url"] == "https://example.com"
    assert r.json()["fields"]["custom_links"][0]["icon"] == "globe"


def test_reject_non_http_url(auth_client_pro):
    created = auth_client_pro.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_pro.patch(
        f"/api/v1/cards/{created['id']}",
        json={
            "fields": {
                "custom_links": [
                    {
                        "id": "a1",
                        "title": "Bad",
                        "url": "javascript:alert(1)",
                        "sort": 0,
                    }
                ]
            }
        },
    )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_custom_link"


def test_reject_too_many_custom_links(auth_client_pro):
    created = auth_client_pro.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    links = [
        {
            "id": str(i),
            "title": f"Link {i}",
            "url": f"https://example.com/{i}",
            "sort": i,
        }
        for i in range(21)
    ]
    r = auth_client_pro.patch(
        f"/api/v1/cards/{created['id']}",
        json={"fields": {"custom_links": links}},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "too_many_custom_links"
