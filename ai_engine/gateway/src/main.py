from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, HTTPException, Header, Request, status
from fastapi.responses import JSONResponse

from src.config import Settings, get_settings
from src.dependencies import verify_api_key
from src.models import ChatRequest, ErrorEnvelope, ErrorDetail, SuccessEnvelope


def create_app(
    settings: Settings,
    ollama_client: httpx.AsyncClient | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        managed_client: httpx.AsyncClient | None = None
        if ollama_client is None:
            managed_client = httpx.AsyncClient(
                base_url=settings.ollama_url,
                timeout=settings.request_timeout_seconds,
            )
            app.state.ollama_client = managed_client
        else:
            app.state.ollama_client = ollama_client

        try:
            yield
        finally:
            if managed_client is not None:
                await managed_client.aclose()

    app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)
    app.state.settings = settings
    if ollama_client is not None:
        app.state.ollama_client = ollama_client

    def settings_dependency() -> Settings:
        return app.state.settings

    def require_api_key(
        x_api_key: str | None = Header(default=None),
        settings: Settings = Depends(settings_dependency),
    ) -> None:
        verify_api_key(x_api_key, settings)

    async def get_ollama_client() -> httpx.AsyncClient:
        return app.state.ollama_client

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict) and {"code", "message"} <= set(detail):
            payload = ErrorEnvelope(error=ErrorDetail(**detail))
        else:
            payload = ErrorEnvelope(
                error=ErrorDetail(code="http_error", message=str(detail)),
            )
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
        payload = ErrorEnvelope(
            error=ErrorDetail(
                code="internal_server_error",
                message="An unexpected error occurred.",
            )
        )
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload.model_dump())

    @app.get("/health", response_model=SuccessEnvelope)
    async def health() -> SuccessEnvelope:
        return SuccessEnvelope(
            data={
                "status": "ok",
                "service": settings.app_name,
                "version": settings.app_version,
            }
        )

    @app.get("/models", response_model=SuccessEnvelope)
    async def list_models(
        _: None = Depends(require_api_key),
        client: httpx.AsyncClient = Depends(get_ollama_client),
    ) -> SuccessEnvelope:
        data = await _ollama_get(client, "/api/tags")
        return SuccessEnvelope(data=data)

    @app.post("/v1/chat", response_model=SuccessEnvelope)
    async def chat(
        body: ChatRequest,
        _: None = Depends(require_api_key),
        client: httpx.AsyncClient = Depends(get_ollama_client),
    ) -> SuccessEnvelope:
        payload = {
            "model": body.model or settings.default_model,
            "messages": [message.model_dump() for message in body.messages],
            "stream": False,
            "options": {
                "temperature": body.temperature,
                "num_predict": body.max_tokens,
            },
        }
        if body.system is not None:
            payload["system"] = body.system

        data = await _ollama_post(client, "/api/chat", payload)
        return SuccessEnvelope(
            data={
                "model": data.get("model", payload["model"]),
                "content": data.get("message", {}).get("content", ""),
            }
        )

    return app


async def _ollama_get(client: httpx.AsyncClient, path: str) -> dict:
    try:
        response = await client.get(path)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(code="ollama_error", message="Ollama request failed.").model_dump(),
        ) from exc


async def _ollama_post(client: httpx.AsyncClient, path: str, payload: dict) -> dict:
    try:
        response = await client.post(path, json=payload)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(code="ollama_error", message="Ollama request failed.").model_dump(),
        ) from exc


app = create_app(get_settings())
