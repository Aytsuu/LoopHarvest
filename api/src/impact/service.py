from decimal import Decimal

from src.categories.constants import DEFAULT_CO2_FACTOR_PER_KG, DEFAULT_WATER_SAVED_LITERS_PER_KG
from src.categories.service import category_service
from src.impact.schemas import ImpactSummary
from src.listings.service import listing_service
from src.requests.service import request_service


class ImpactService:
    async def get_summary(self) -> ImpactSummary:
        categories = await category_service.list_categories()
        listings = await listing_service.list_listings()
        requests = await request_service.list_requests()
        categories_by_slug = {category.slug: category for category in categories}

        def get_co2_factor(category_slug: str) -> Decimal:
            category = categories_by_slug.get(category_slug)
            return category.co2_factor_per_kg if category else DEFAULT_CO2_FACTOR_PER_KG

        def get_water_factor(category_slug: str) -> Decimal:
            category = categories_by_slug.get(category_slug)
            return (
                category.water_saved_liters_per_kg
                if category
                else DEFAULT_WATER_SAVED_LITERS_PER_KG
            )

        total_kg_diverted = sum((listing.quantity_kg for listing in listings), start=Decimal("0"))
        total_co2_saved_kg = sum(
            (listing.quantity_kg * get_co2_factor(listing.category_slug) for listing in listings),
            start=Decimal("0"),
        )
        total_water_saved_liters = sum(
            (listing.quantity_kg * get_water_factor(listing.category_slug) for listing in listings),
            start=Decimal("0"),
        )
        active_listings = sum(1 for listing in listings if listing.status == "open")
        active_requests = sum(1 for request in requests if request.status == "open")

        return ImpactSummary(
            total_kg_diverted=total_kg_diverted,
            total_co2_saved_kg=total_co2_saved_kg,
            total_water_saved_liters=total_water_saved_liters,
            active_listings=active_listings,
            active_requests=active_requests,
        )


impact_service = ImpactService()
