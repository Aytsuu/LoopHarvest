from decimal import Decimal

from src.categories.constants import DEFAULT_CO2_FACTOR_PER_KG
from src.impact.schemas import ImpactSummary
from src.listings.service import listing_service
from src.requests.service import request_service


class ImpactService:
    def get_summary(self) -> ImpactSummary:
        listings = listing_service.list_listings()
        total_kg_diverted = sum((listing.quantity_kg for listing in listings), start=Decimal("0"))
        total_co2_saved_kg = total_kg_diverted * Decimal(str(DEFAULT_CO2_FACTOR_PER_KG))
        return ImpactSummary(
            total_kg_diverted=total_kg_diverted,
            total_co2_saved_kg=total_co2_saved_kg,
            active_listings=len(listings),
            active_requests=len(request_service.list_requests()),
        )


impact_service = ImpactService()
