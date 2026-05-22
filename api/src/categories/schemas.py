from decimal import Decimal

from pydantic import Field

from src.models import ApiModel


class Category(ApiModel):
    slug: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=1, max_length=128)
    parent_slug: str | None = Field(default=None, max_length=64)
    co2_factor_per_kg: Decimal = Field(default=Decimal("0.5"), ge=0)
    water_saved_liters_per_kg: Decimal = Field(default=Decimal("50"), ge=0)
