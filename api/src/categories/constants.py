
from src.categories.schemas import Category

DEFAULT_CO2_FACTOR_PER_KG = 0.5


def build_seed_categories() -> list[Category]:
    seeds: list[tuple[str, str, str | None]] = [
        ("organic", "Organic", None),
        ("vegetable-scraps", "Vegetable Scraps", "organic"),
        ("fruit-waste", "Fruit Waste", "organic"),
        ("coffee-grounds", "Coffee Grounds", "organic"),
        ("tea-leaves", "Tea Leaves", "organic"),
        ("eggshells", "Eggshells", "organic"),
        ("bread-stale", "Stale Bread", "organic"),
        ("rice-cooked", "Cooked Rice", "organic"),
        ("fish-bones-shells", "Fish Bones and Shells", "organic"),
        ("meat-trimmings", "Meat Trimmings", "organic"),
        ("brewery-fermentation", "Brewery and Fermentation", None),
        ("spent-grain", "Spent Grain", "brewery-fermentation"),
        ("fruit-pomace", "Fruit Pomace", "brewery-fermentation"),
        ("whey", "Whey", "brewery-fermentation"),
        ("sourdough-discard", "Sourdough Discard", "brewery-fermentation"),
        ("yeast-slurry", "Yeast Slurry", "brewery-fermentation"),
        ("agricultural", "Agricultural", None),
        ("blemished-produce", "Blemished Produce", "agricultural"),
        ("crop-trimmings", "Crop Trimmings", "agricultural"),
        ("husks-bran", "Husks and Bran", "agricultural"),
        ("processing-by-products", "Processing By-Products", None),
        ("cooking-oil-used", "Used Cooking Oil", "processing-by-products"),
        ("food-processing-waste", "Food Processing Waste", "processing-by-products"),
        ("surplus-packaged-food", "Surplus Packaged Food", "processing-by-products"),
        ("other", "Other", None),
        ("compostable-packaging", "Compostable Packaging", "other"),
        ("garden-waste", "Garden Waste", "other"),
    ]
    return [
        Category(
            slug=slug,
            label=label,
            parent_slug=parent_slug,
            co2_factor_per_kg=DEFAULT_CO2_FACTOR_PER_KG,
        )
        for slug, label, parent_slug in seeds
    ]
