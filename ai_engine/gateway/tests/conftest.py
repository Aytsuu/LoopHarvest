import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("MY_API_KEY", "test-secret")

from src.config import Settings, get_settings
from src.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(
        app_name="LoopHarvest AI Gateway",
        api_key="test-secret",
        default_model="qwen2.5:1.5b",
        fallback_model="gemma3:4b",
        vision_model="gemini-2.5-flash",
        google_ai_studio_api_key="test-gemini-key",
        ollama_url="http://ollama:11434",
        request_timeout_seconds=30.0,
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncClient:
    app = create_app(settings)
    app.dependency_overrides[get_settings] = lambda: settings
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
