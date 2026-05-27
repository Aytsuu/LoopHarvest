from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from src.auth.schemas import AuthenticatedUser
from src.listings.schemas import Listing
from src.listings.service import listing_service
from src.location.service import location_service
from src.matches.schemas import (
    ListingMatch,
    ListingMatchGroup,
    MatchReason,
    PersonalizedMatches,
    RequestMatch,
    RequestMatchGroup,
)
from src.requests.schemas import Request
from src.requests.service import request_service


class MatchService:
    async def get_personalized_matches(self, current_user: AuthenticatedUser) -> PersonalizedMatches:
        listings = await listing_service.list_listings()
        requests = await request_service.list_requests()

        my_open_requests = [
            request for request in requests if request.requester_id == current_user.id and request.status == "open"
        ]
        my_open_listings = [
            listing for listing in listings if listing.donor_id == current_user.id and listing.status == "open"
        ]
        candidate_listings = [
            listing for listing in listings if listing.status == "open" and listing.donor_id != current_user.id
        ]
        candidate_requests = [
            request for request in requests if request.status == "open" and request.requester_id != current_user.id
        ]

        request_groups = [
            group
            for group in (
                self._build_request_match_group(source_request=request, candidate_listings=candidate_listings)
                for request in my_open_requests
            )
            if group.total_matches > 0
        ]
        listing_groups = [
            group
            for group in (
                self._build_listing_match_group(source_listing=listing, candidate_requests=candidate_requests)
                for listing in my_open_listings
            )
            if group.total_matches > 0
        ]

        request_groups.sort(key=lambda group: (group.total_matches, group.source_request.created_at), reverse=True)
        listing_groups.sort(key=lambda group: (group.total_matches, group.source_listing.created_at), reverse=True)

        return PersonalizedMatches(
            auto_mode="matches" if request_groups or listing_groups else "marketplace",
            request_matches=request_groups,
            listing_matches=listing_groups,
        )

    def _build_request_match_group(
        self,
        *,
        source_request: Request,
        candidate_listings: list[Listing],
    ) -> RequestMatchGroup:
        matches: list[ListingMatch] = []
        for listing in candidate_listings:
            score, reasons, distance_km = self._score_listing_for_request(
                source_request=source_request,
                listing=listing,
            )
            if score is None:
                continue
            matches.append(
                ListingMatch(
                    listing=listing,
                    score=score,
                    distance_km=distance_km,
                    reasons=reasons,
                )
            )

        matches.sort(
            key=lambda match: (
                -float(match.score),
                float(match.distance_km) if match.distance_km is not None else float("inf"),
            )
        )
        return RequestMatchGroup(
            source_request=source_request,
            matches=matches,
            total_matches=len(matches),
        )

    def _build_listing_match_group(
        self,
        *,
        source_listing: Listing,
        candidate_requests: list[Request],
    ) -> ListingMatchGroup:
        matches: list[RequestMatch] = []
        for request in candidate_requests:
            score, reasons, distance_km = self._score_request_for_listing(
                source_listing=source_listing,
                request=request,
            )
            if score is None:
                continue
            matches.append(
                RequestMatch(
                    request=request,
                    score=score,
                    distance_km=distance_km,
                    reasons=reasons,
                )
            )

        matches.sort(
            key=lambda match: (
                -float(match.score),
                float(match.distance_km) if match.distance_km is not None else float("inf"),
            )
        )
        return ListingMatchGroup(
            source_listing=source_listing,
            matches=matches,
            total_matches=len(matches),
        )

    def _score_listing_for_request(
        self,
        *,
        source_request: Request,
        listing: Listing,
    ) -> tuple[Decimal | None, list[MatchReason], Decimal | None]:
        if listing.category_slug != source_request.category_slug:
            return None, [], None

        reasons: list[MatchReason] = [MatchReason(code="same_category", label="Same category")]
        score = Decimal("60")

        if source_request.city.strip().lower() == listing.city.strip().lower():
            reasons.append(MatchReason(code="same_city", label="Same city"))
            score += Decimal("20")

        if self._quantity_fits_request(listing=listing, source_request=source_request):
            reasons.append(MatchReason(code="quantity_fit", label="Quantity fits"))
            score += Decimal("20")
        elif source_request.quantity_kg_min is not None or source_request.quantity_kg_max is not None:
            return None, [], None

        distance_km = location_service.distance_km(
            source_request.location_latitude,
            source_request.location_longitude,
            listing.location_latitude,
            listing.location_longitude,
        )
        if distance_km is not None and distance_km <= source_request.max_distance_km:
            reasons.append(MatchReason(code="within_preferred_radius", label="Within preferred radius"))
            score += Decimal("10")
        elif distance_km is not None and distance_km > source_request.max_distance_km:
            return None, [], None

        return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), reasons, distance_km

    def _score_request_for_listing(
        self,
        *,
        source_listing: Listing,
        request: Request,
    ) -> tuple[Decimal | None, list[MatchReason], Decimal | None]:
        if request.category_slug != source_listing.category_slug:
            return None, [], None

        reasons: list[MatchReason] = [MatchReason(code="same_category", label="Same category")]
        score = Decimal("60")

        if request.city.strip().lower() == source_listing.city.strip().lower():
            reasons.append(MatchReason(code="same_city", label="Same city"))
            score += Decimal("20")

        if self._listing_fits_request_range(source_listing=source_listing, request=request):
            reasons.append(MatchReason(code="quantity_fit", label="Quantity fits"))
            score += Decimal("20")
        elif request.quantity_kg_min is not None or request.quantity_kg_max is not None:
            return None, [], None

        distance_km = location_service.distance_km(
            source_listing.location_latitude,
            source_listing.location_longitude,
            request.location_latitude,
            request.location_longitude,
        )
        if distance_km is not None and distance_km <= request.max_distance_km:
            reasons.append(MatchReason(code="within_preferred_radius", label="Within preferred radius"))
            score += Decimal("10")
        elif distance_km is not None and distance_km > request.max_distance_km:
            return None, [], None

        return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), reasons, distance_km

    def _quantity_fits_request(self, *, listing: Listing, source_request: Request) -> bool:
        if source_request.quantity_kg_min is not None and listing.quantity_kg < source_request.quantity_kg_min:
            return False
        if source_request.quantity_kg_max is not None and listing.quantity_kg > source_request.quantity_kg_max:
            return False
        return True

    def _listing_fits_request_range(self, *, source_listing: Listing, request: Request) -> bool:
        if request.quantity_kg_min is not None and source_listing.quantity_kg < request.quantity_kg_min:
            return False
        if request.quantity_kg_max is not None and source_listing.quantity_kg > request.quantity_kg_max:
            return False
        return True


match_service = MatchService()
