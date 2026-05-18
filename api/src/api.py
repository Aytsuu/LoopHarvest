from fastapi import APIRouter

from src.auth.router import router as auth_router
from src.categories.router import router as categories_router
from src.impact.router import router as impact_router
from src.listings.router import router as listings_router
from src.requests.router import router as requests_router


def build_api_router() -> APIRouter:
    router = APIRouter()
    router.include_router(auth_router)
    router.include_router(categories_router)
    router.include_router(listings_router)
    router.include_router(requests_router)
    router.include_router(impact_router)
    return router
