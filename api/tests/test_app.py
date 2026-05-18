from uuid import uuid4

from src.auth.dependencies import get_current_user
from src.auth.schemas import AuthenticatedUser
from src.main import app


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="donor@example.com",
        display_name="Cafe Donor",
    )


async def test_health_check(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {
            "status": "ok",
            "service": "loop-harvest-api",
        },
        "message": None,
    }


async def test_list_categories_includes_appendix_taxonomy(client):
    response = await client.get("/api/v1/categories")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert any(category["slug"] == "coffee-grounds" for category in payload["data"])
    assert any(category["slug"] == "spent-grain" for category in payload["data"])


async def test_create_listing_and_impact_summary(client):
    app.dependency_overrides[get_current_user] = _fake_user
    listing_payload = {
        "title": "Morning coffee grounds",
        "description": "Fresh grounds from cafe prep.",
        "category_slug": "coffee-grounds",
        "quantity_kg": "8.5",
        "pickup_address": "123 Market St",
        "city": "Manila",
        "country": "Philippines",
    }

    create_response = await client.post("/api/v1/listings", json=listing_payload)
    app.dependency_overrides.clear()

    assert create_response.status_code == 201
    created_listing = create_response.json()["data"]
    assert created_listing["status"] == "open"
    assert created_listing["category_slug"] == "coffee-grounds"

    impact_response = await client.get("/api/v1/impact/summary")

    assert impact_response.status_code == 200
    assert impact_response.json()["data"] == {
        "total_kg_diverted": "8.5",
        "total_co2_saved_kg": "4.25",
        "active_listings": 1,
        "active_requests": 0,
    }


async def test_create_request(client):
    app.dependency_overrides[get_current_user] = _fake_user
    request_payload = {
        "title": "Weekly spent grain",
        "description": "Need spent grain for feed mix.",
        "category_slug": "spent-grain",
        "quantity_kg_min": "5",
        "quantity_kg_max": "20",
        "frequency": "weekly",
        "city": "Quezon City",
        "country": "Philippines",
        "max_distance_km": "12",
    }

    response = await client.post("/api/v1/requests", json=request_payload)
    app.dependency_overrides.clear()

    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "open"
    assert payload["data"]["frequency"] == "weekly"


async def test_missing_category_returns_enveloped_not_found(client):
    response = await client.get("/api/v1/categories/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "success": False,
        "error": {
            "code": "not_found",
            "message": "Category was not found.",
        },
    }
