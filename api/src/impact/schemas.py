from decimal import Decimal

from src.models import ApiModel


class ImpactSummary(ApiModel):
    total_kg_diverted: Decimal
    total_co2_saved_kg: Decimal
    total_water_saved_liters: Decimal
    active_listings: int
    active_requests: int
