from uuid import uuid4

from src.auth.dependencies import get_current_user
from src.auth.schemas import AuthenticatedUser
from src.main import app


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="survey@example.com",
        display_name="Survey User",
    )


async def test_get_my_survey_returns_null_before_submission(client):
    app.dependency_overrides[get_current_user] = _fake_user

    try:
        response = await client.get("/api/v1/survey/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"] is None


async def test_put_my_survey_persists_and_returns_submission(client):
    current_user = _fake_user()
    app.dependency_overrides[get_current_user] = lambda: current_user

    try:
        save_response = await client.put(
            "/api/v1/survey/me",
            json={
                "purpose": ["personal", "education"],
                "role": "both",
                "waste_types": ["vegetable", "compost"],
                "frequency": "weekly",
                "location_radius": 12,
                "goals": ["reduce_waste", "track_impact"],
                "ai_consent": {
                    "ai_recommendations": True,
                    "ai_auto_tag": True,
                    "ai_impact_insights": False,
                    "ai_match_alerts": True,
                    "data_improvement": False,
                },
                "notifications": {
                    "channels": {
                        "push": False,
                        "email": True,
                    },
                    "frequency": "daily",
                },
            },
        )
        fetch_response = await client.get("/api/v1/survey/me")
    finally:
        app.dependency_overrides.clear()

    assert save_response.status_code == 200
    saved_payload = save_response.json()["data"]
    assert saved_payload["user_id"] == str(current_user.id)
    assert saved_payload["role"] == "both"
    assert saved_payload["location_radius"] == 12
    assert saved_payload["notifications"]["frequency"] == "daily"

    assert fetch_response.status_code == 200
    fetched_payload = fetch_response.json()["data"]
    assert fetched_payload["purpose"] == ["personal", "education"]
    assert fetched_payload["waste_types"] == ["vegetable", "compost"]
