import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

from src.config import Settings
from src.main import create_app


class OllamaMockTransport(ASGITransport):
    def __init__(self) -> None:
        from fastapi import FastAPI, Response

        app = FastAPI()

        @app.get("/api/tags")
        async def list_models():
            return {"models": [{"name": "qwen2.5:1.5b"}, {"name": "gemma3:1b"}]}

        @app.post("/api/chat")
        async def chat(payload: dict):
            if payload["model"] == "missing-model":
                return Response(
                    content='{"error":"model not found"}',
                    media_type="application/json",
                    status_code=status.HTTP_404_NOT_FOUND,
                )

            return {
                "model": payload["model"],
                "message": {"content": "mocked reply"},
            }

        super().__init__(app=app)


@pytest.fixture
async def upstream_client() -> AsyncClient:
    async with AsyncClient(transport=OllamaMockTransport(), base_url="http://ollama") as client:
        yield client


@pytest.fixture
async def app_client(settings: Settings, upstream_client: AsyncClient) -> AsyncClient:
    app = create_app(settings, ollama_client=upstream_client)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.mark.asyncio
async def test_health_endpoint_is_public(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "success": True,
        "data": {
            "status": "ok",
            "service": "LoopHarvest AI Gateway",
            "version": "1.0.0",
        },
    }


@pytest.mark.asyncio
async def test_models_requires_api_key(client: AsyncClient) -> None:
    response = await client.get("/models")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {
        "success": False,
        "error": {
            "code": "unauthorized",
            "message": "Invalid API key.",
        },
    }


@pytest.mark.asyncio
async def test_models_returns_upstream_models(app_client: AsyncClient) -> None:
    response = await app_client.get("/models", headers={"x-api-key": "test-secret"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "success": True,
        "data": {
            "models": [{"name": "qwen2.5:1.5b"}, {"name": "gemma3:1b"}],
        },
    }


@pytest.mark.asyncio
async def test_chat_uses_default_model_and_returns_content(app_client: AsyncClient) -> None:
    response = await app_client.post(
        "/v1/chat",
        headers={"x-api-key": "test-secret"},
        json={
            "messages": [{"role": "user", "content": "Hello"}],
            "temperature": 0.5,
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "success": True,
        "data": {
            "model": "qwen2.5:1.5b",
            "content": "mocked reply",
        },
    }


@pytest.mark.asyncio
async def test_chat_surfaces_upstream_not_found_as_bad_gateway(app_client: AsyncClient) -> None:
    response = await app_client.post(
        "/v1/chat",
        headers={"x-api-key": "test-secret"},
        json={
            "model": "missing-model",
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )

    assert response.status_code == status.HTTP_502_BAD_GATEWAY
    assert response.json() == {
        "success": False,
        "error": {
            "code": "ollama_error",
            "message": "Ollama request failed.",
        },
    }
