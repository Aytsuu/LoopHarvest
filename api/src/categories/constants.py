
from decimal import Decimal

from src.categories.schemas import Category

DEFAULT_CO2_FACTOR_PER_KG = Decimal("0.5")
DEFAULT_WATER_SAVED_LITERS_PER_KG = Decimal("50")


def build_seed_categories() -> list[Category]:
    seeds: list[tuple[str, str, str | None, Decimal, Decimal]] = [
        ("food-scraps", "Food Scraps", None, Decimal("0.5"), Decimal("50")),
        ("spent-grain", "Spent Grain", None, Decimal("1.2"), Decimal("120")),
        ("coffee-grounds", "Coffee Grounds", None, Decimal("0.8"), Decimal("80")),
        ("vegetable-scraps", "Vegetable Scraps", None, Decimal("0.4"), Decimal("40")),
        ("fruit-waste", "Fruit Waste", None, Decimal("0.6"), Decimal("65")),
        ("surplus-meals", "Surplus Meals", None, Decimal("2.5"), Decimal("250")),
    ]
    return [
        Category(
            slug=slug,
            label=label,
            parent_slug=parent_slug,
            co2_factor_per_kg=co2_factor_per_kg,
            water_saved_liters_per_kg=water_saved_liters_per_kg,
        )
        for slug, label, parent_slug, co2_factor_per_kg, water_saved_liters_per_kg in seeds
    ]
