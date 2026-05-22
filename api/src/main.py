from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api import build_api_router
from src.config import get_settings
from src.health.router import router as health_router
from src.models import ErrorEnvelope


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    docs_url=settings.docs_url,
    openapi_url=settings.openapi_url,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(build_api_router(), prefix=settings.api_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    payload = ErrorEnvelope(
        error={
            "code": "internal_server_error",
            "message": "An unexpected error occurred.",
        }
    )
    return JSONResponse(status_code=500, content=payload.model_dump())


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        payload = ErrorEnvelope(error=detail)
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    payload = ErrorEnvelope(
        error={
            "code": "http_error",
            "message": str(detail),
        }
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())
