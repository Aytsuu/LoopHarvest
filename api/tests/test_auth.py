from uuid import uuid4

from src.auth.dependencies import get_current_user
from src.auth.schemas import AuthenticatedUser
from src.main import app


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="grower@example.com",
        display_name="Urban Grower",
    )


async def test_auth_me_returns_current_user(client):
    app.dependency_overrides[get_current_user] = _fake_user

    response = await client.get("/api/v1/auth/me")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "grower@example.com"


async def test_create_listing_requires_authentication(client):
    response = await client.post(
        "/api/v1/listings",
        json={
            "title": "Morning coffee grounds",
            "description": "Fresh grounds from cafe prep.",
            "category_slug": "coffee-grounds",
            "quantity_kg": "8.5",
            "pickup_address": "123 Market St",
            "city": "Manila",
            "country": "Philippines",
        },
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_required"
