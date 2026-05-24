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


async def test_cors_allows_local_frontend_origin(client):
    response = await client.options(
        "/api/v1/categories",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


async def test_cors_allows_private_lan_frontend_origin(client):
    response = await client.options(
        "/api/v1/categories",
        headers={
            "Origin": "http://192.168.1.3:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://192.168.1.3:3000"


async def test_list_categories_uses_six_row_taxonomy(client):
    response = await client.get("/api/v1/categories")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) == 6
    assert any(category["slug"] == "food-scraps" for category in payload["data"])
    assert any(category["slug"] == "coffee-grounds" for category in payload["data"])
    assert any(category["slug"] == "spent-grain" for category in payload["data"])


async def test_create_listing_and_impact_summary(client):
    app.dependency_overrides[get_current_user] = _fake_user
    listing_payload = {
        "title": "Morning coffee grounds",
        "description": "Fresh grounds from cafe prep.",
        "category_slug": "coffee-grounds",
        "quantity_kg": "8.5",
        "claim_type": "message",
        "pickup_address": "123 Market St",
        "city": "Manila",
        "country": "Philippines",
    }

    create_response = await client.post("/api/v1/listings", json=listing_payload)

    assert create_response.status_code == 201
    created_listing = create_response.json()["data"]
    assert created_listing["status"] == "open"
    assert created_listing["category_slug"] == "coffee-grounds"
    assert created_listing["claim_type"] == "message"

    impact_response = await client.get("/api/v1/impact/summary")

    assert impact_response.status_code == 200
    assert impact_response.json()["data"] == {
        "total_kg_diverted": "0",
        "total_co2_saved_kg": "0",
        "total_water_saved_liters": "0",
        "active_listings": 1,
        "active_requests": 0,
    }

    complete_response = await client.post(f"/api/v1/listings/{created_listing['id']}/complete")
    app.dependency_overrides.clear()

    assert complete_response.status_code == 200
    assert complete_response.json()["data"]["status"] == "completed"

    completed_impact_response = await client.get("/api/v1/impact/summary")
    assert completed_impact_response.status_code == 200
    assert completed_impact_response.json()["data"] == {
        "total_kg_diverted": "8.5",
        "total_co2_saved_kg": "6.80",
        "total_water_saved_liters": "680.0",
        "active_listings": 0,
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


async def test_claim_listing(client):
    app.dependency_overrides[get_current_user] = _fake_user
    create_response = await client.post(
        "/api/v1/listings",
        json={
            "title": "Fresh peelings",
            "description": "Collected today.",
            "category_slug": "vegetable-scraps",
            "quantity_kg": "4",
            "claim_type": "direct",
            "pickup_address": "456 Grove St",
            "city": "Manila",
            "country": "Philippines",
        },
    )

    listing_id = create_response.json()["data"]["id"]
    claim_response = await client.post(f"/api/v1/listings/{listing_id}/claim")
    app.dependency_overrides.clear()

    assert claim_response.status_code == 200
    assert claim_response.json()["data"]["status"] == "claimed"


async def test_complete_listing_from_open_assigns_recipient_and_completes(client):
    donor_user = _fake_user()
    recipient_user = AuthenticatedUser(
        id=uuid4(),
        email="recipient@example.com",
        display_name="Community Recipient",
    )
    app.dependency_overrides[get_current_user] = lambda: donor_user
    create_response = await client.post(
        "/api/v1/listings",
        json={
            "title": "Fresh peelings",
            "description": "Collected today.",
            "category_slug": "vegetable-scraps",
            "quantity_kg": "4",
            "claim_type": "message",
            "pickup_address": "456 Grove St",
            "city": "Manila",
            "country": "Philippines",
        },
    )

    listing_id = create_response.json()["data"]["id"]
    app.dependency_overrides[get_current_user] = lambda: recipient_user
    complete_response = await client.post(f"/api/v1/listings/{listing_id}/complete")
    app.dependency_overrides.clear()

    assert complete_response.status_code == 200
    payload = complete_response.json()["data"]
    assert payload["status"] == "completed"
    assert payload["claimed_by"] == str(recipient_user.id)


async def test_complete_listing_from_claimed_allows_finishing_handoff(client):
    donor_user = _fake_user()
    recipient_user = AuthenticatedUser(
        id=uuid4(),
        email="recipient@example.com",
        display_name="Community Recipient",
    )
    app.dependency_overrides[get_current_user] = lambda: donor_user
    create_response = await client.post(
        "/api/v1/listings",
        json={
            "title": "Fresh peelings",
            "description": "Collected today.",
            "category_slug": "vegetable-scraps",
            "quantity_kg": "4",
            "claim_type": "direct",
            "pickup_address": "456 Grove St",
            "city": "Manila",
            "country": "Philippines",
        },
    )

    listing_id = create_response.json()["data"]["id"]
    app.dependency_overrides[get_current_user] = lambda: recipient_user
    claim_response = await client.post(f"/api/v1/listings/{listing_id}/claim")
    assert claim_response.status_code == 200

    complete_response = await client.post(f"/api/v1/listings/{listing_id}/complete")
    app.dependency_overrides.clear()

    assert complete_response.status_code == 200
    assert complete_response.json()["data"]["status"] == "completed"


async def test_fulfill_request(client):
    app.dependency_overrides[get_current_user] = _fake_user
    create_response = await client.post(
        "/api/v1/requests",
        json={
            "title": "Weekly peelings",
            "description": "Need material for composting.",
            "category_slug": "vegetable-scraps",
            "quantity_kg_min": "2",
            "quantity_kg_max": "8",
            "frequency": "weekly",
            "city": "Quezon City",
            "country": "Philippines",
            "max_distance_km": "10",
        },
    )

    request_id = create_response.json()["data"]["id"]
    fulfill_response = await client.post(f"/api/v1/requests/{request_id}/fulfill")
    app.dependency_overrides.clear()

    assert fulfill_response.status_code == 200
    assert fulfill_response.json()["data"]["status"] == "fulfilled"


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
