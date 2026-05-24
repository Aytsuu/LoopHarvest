from uuid import uuid4

from src.auth.dependencies import get_current_user
from src.auth.schemas import AuthenticatedUser
from src.auth.service import profile_service
from src.main import app


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="grower@example.com",
        display_name="Urban Grower",
    )


async def test_auth_me_returns_current_user(client):
    app.dependency_overrides[get_current_user] = _fake_user
    original_get_current_user = profile_service.get_current_user

    async def fake_get_current_user(current_user):
        return current_user.model_copy(
            update={
                "avatar_url": "https://example.com/uploads/profile.png",
            }
        )

    profile_service.get_current_user = fake_get_current_user

    try:
        response = await client.get("/api/v1/auth/me")
    finally:
        profile_service.get_current_user = original_get_current_user
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["email"] == "grower@example.com"
    assert response.json()["data"]["avatar_url"] == "https://example.com/uploads/profile.png"


async def test_auth_me_falls_back_to_email_derived_profile(client):
    current_user = AuthenticatedUser(
        id=uuid4(),
        email="paolo.araneta@example.com",
    )
    app.dependency_overrides[get_current_user] = lambda: current_user

    try:
        response = await client.get("/api/v1/auth/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["display_name"] == "Paolo Araneta"
    assert payload["avatar_url"] is None


async def test_auth_me_filters_generated_avatar_urls(client):
    current_user = AuthenticatedUser(
        id=uuid4(),
        email="grower@example.com",
        avatar_url="https://www.gravatar.com/avatar/test?s=256",
    )
    app.dependency_overrides[get_current_user] = lambda: current_user

    try:
        response = await client.get("/api/v1/auth/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["avatar_url"] is None


async def test_create_listing_requires_authentication(client):
    response = await client.post(
        "/api/v1/listings",
        json={
            "title": "Morning coffee grounds",
            "description": "Fresh grounds from cafe prep.",
            "category_slug": "coffee-grounds",
            "quantity_kg": "8.5",
            "claim_type": "message",
            "pickup_address": "123 Market St",
            "city": "Manila",
            "country": "Philippines",
        },
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_required"


async def test_patch_auth_me_updates_profile_via_api(client):
    current_user = _fake_user()
    app.dependency_overrides[get_current_user] = lambda: current_user
    original_update_current_user = profile_service.update_current_user

    async def fake_update_current_user(*, access_token, current_user, payload):
        assert access_token == "test-token"
        assert payload.email == current_user.email
        return current_user.model_copy(
            update={
                "email": current_user.email,
                "display_name": payload.display_name,
                "avatar_url": payload.avatar_url,
                "city": payload.city,
                "state_region": payload.state_region,
                "postal_code": payload.postal_code,
                "country": payload.country,
                "bio": payload.bio,
            }
        )

    profile_service.update_current_user = fake_update_current_user
    try:
        response = await client.patch(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test-token"},
            json={
                "email": current_user.email,
                "display_name": "Urban Grower Pro",
                "avatar_url": "https://example.com/uploads/profile.png",
                "city": "Manila",
                "state_region": "Metro Manila",
                "postal_code": "1000",
                "country": "Philippines",
                "bio": "Compost collector",
            },
        )
    finally:
        profile_service.update_current_user = original_update_current_user
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["email"] == current_user.email
    assert payload["display_name"] == "Urban Grower Pro"
    assert payload["avatar_url"] == "https://example.com/uploads/profile.png"


async def test_patch_auth_me_accepts_null_avatar_url(client):
    current_user = _fake_user()
    app.dependency_overrides[get_current_user] = lambda: current_user
    original_update_current_user = profile_service.update_current_user

    async def fake_update_current_user(*, access_token, current_user, payload):
        assert payload.avatar_url is None
        return current_user.model_copy(
            update={
                "email": payload.email,
                "display_name": payload.display_name,
                "avatar_url": payload.avatar_url,
            }
        )

    profile_service.update_current_user = fake_update_current_user
    try:
        response = await client.patch(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test-token"},
            json={
                "email": "new-grower@example.com",
                "display_name": "Urban Grower Pro",
                "avatar_url": None,
                "city": None,
                "state_region": None,
                "postal_code": None,
                "country": None,
                "bio": None,
            },
        )
    finally:
        profile_service.update_current_user = original_update_current_user
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["avatar_url"] is None


async def test_patch_auth_me_rejects_email_changes(client):
    current_user = _fake_user()
    app.dependency_overrides[get_current_user] = lambda: current_user

    try:
        response = await client.patch(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test-token"},
            json={
                "email": "other@example.com",
                "display_name": "Urban Grower Pro",
                "avatar_url": None,
                "city": None,
                "state_region": None,
                "postal_code": None,
                "country": None,
                "bio": None,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    payload = response.json()["error"]
    assert payload["code"] == "email_change_not_allowed"
