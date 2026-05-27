from decimal import Decimal
from typing import Literal

from src.listings.schemas import Listing
from src.models import ApiModel
from src.requests.schemas import Request


class MatchReason(ApiModel):
    code: str
    label: str


class ListingMatch(ApiModel):
    listing: Listing
    score: Decimal
    distance_km: Decimal | None = None
    reasons: list[MatchReason]


class RequestMatch(ApiModel):
    request: Request
    score: Decimal
    distance_km: Decimal | None = None
    reasons: list[MatchReason]


class RequestMatchGroup(ApiModel):
    source_request: Request
    matches: list[ListingMatch]
    total_matches: int


class ListingMatchGroup(ApiModel):
    source_listing: Listing
    matches: list[RequestMatch]
    total_matches: int


class PersonalizedMatches(ApiModel):
    auto_mode: Literal["matches", "marketplace"]
    request_matches: list[RequestMatchGroup]
    listing_matches: list[ListingMatchGroup]
