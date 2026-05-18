from src.categories.constants import build_seed_categories
from src.categories.schemas import Category
from src.exceptions import NotFoundException


class CategoryService:
    def __init__(self) -> None:
        self._categories = tuple(build_seed_categories())

    def list_categories(self) -> list[Category]:
        return list(self._categories)

    def get_category(self, slug: str) -> Category:
        for category in self._categories:
            if category.slug == slug:
                return category
        raise NotFoundException("Category")


category_service = CategoryService()
