from __future__ import annotations

from src.categories.constants import build_seed_categories
from src.categories.schemas import Category
from src.config import Settings, get_settings
from src.exceptions import NotFoundException
from src.supabase_rest import SupabaseRestClient


class CategoryRepository:
    async def list_categories(self) -> list[Category]:
        raise NotImplementedError

    async def get_category(self, slug: str) -> Category:
        raise NotImplementedError


class InMemoryCategoryRepository(CategoryRepository):
    def __init__(self) -> None:
        self._categories = tuple(build_seed_categories())

    async def list_categories(self) -> list[Category]:
        return list(self._categories)

    async def get_category(self, slug: str) -> Category:
        for category in self._categories:
            if category.slug == slug:
                return category
        raise NotFoundException("Category")


class SupabaseCategoryRepository(CategoryRepository):
    def __init__(self, settings: Settings) -> None:
        self._rest = SupabaseRestClient(settings)

    async def list_categories(self) -> list[Category]:
        rows = await self._rest.select(
            "categories",
            columns="slug,label,parent_slug,co2_factor_per_kg,water_saved_liters_per_kg",
            order="id.asc",
        )
        return [Category(**row) for row in rows]

    async def get_category(self, slug: str) -> Category:
        rows = await self._rest.select(
            "categories",
            columns="slug,label,parent_slug,co2_factor_per_kg,water_saved_liters_per_kg",
            filters={"slug": f"eq.{slug}"},
        )
        if not rows:
            raise NotFoundException("Category")
        return Category(**rows[0])


class CategoryService:
    def __init__(self, repository: CategoryRepository) -> None:
        self._repository = repository

    async def list_categories(self) -> list[Category]:
        return await self._repository.list_categories()

    async def get_category(self, slug: str) -> Category:
        return await self._repository.get_category(slug)


def _build_category_repository(settings: Settings) -> CategoryRepository:
    if (
        settings.supabase_project_url
        and settings.supabase_service_role_key
    ):
        return SupabaseCategoryRepository(settings)
    return InMemoryCategoryRepository()


category_service = CategoryService(_build_category_repository(get_settings()))
