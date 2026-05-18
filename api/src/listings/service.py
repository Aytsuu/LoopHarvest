from uuid import UUID

from src.exceptions import NotFoundException
from src.listings.schemas import Listing, ListingCreate


class ListingService:
    def __init__(self) -> None:
        self._listings: list[Listing] = []

    def list_listings(self) -> list[Listing]:
        return list(self._listings)

    def create_listing(self, payload: ListingCreate, donor_id: UUID) -> Listing:
        listing = Listing(**payload.model_dump(), donor_id=donor_id)
        self._listings.append(listing)
        return listing

    def get_listing(self, listing_id: str) -> Listing:
        for listing in self._listings:
            if str(listing.id) == listing_id:
                return listing
        raise NotFoundException("Listing")


listing_service = ListingService()
