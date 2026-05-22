from fastapi import APIRouter

from src.categories.schemas import Category
from src.categories.service import category_service
from src.models import ApiEnvelope

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=ApiEnvelope[list[Category]], summary="List categories")
async def list_categories() -> ApiEnvelope[list[Category]]:
    return ApiEnvelope(data=await category_service.list_categories())


@router.get("/{slug}", response_model=ApiEnvelope[Category], summary="Get category")
async def get_category(slug: str) -> ApiEnvelope[Category]:
    return ApiEnvelope(data=await category_service.get_category(slug))
