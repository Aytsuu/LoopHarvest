from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI

from src.config import Settings, get_settings
from src.routers import chat, vision

load_dotenv()


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        managed_client = httpx.AsyncClient(
            base_url=app_settings.ollama_url,
            timeout=app_settings.request_timeout_seconds,
        )
        app.state.ollama_client = managed_client

        try:
            yield
        finally:
            await managed_client.aclose()

    app = FastAPI(
        title=app_settings.app_name,
        version=app_settings.app_version,
        lifespan=lifespan,
    )
    app.state.settings = app_settings

    app.include_router(chat.router)
    app.include_router(vision.router)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": app_settings.app_version}

    @app.get("/models")
    async def models() -> dict:
        client = app.state.ollama_client
        response = await client.get("/api/tags")
        response.raise_for_status()
        return response.json()

    return app


app = create_app()
