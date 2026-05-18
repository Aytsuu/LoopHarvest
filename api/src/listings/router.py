from fastapi import APIRouter, status

from src.auth.dependencies import CurrentUser
from src.listings.schemas import Listing, ListingCreate
from src.listings.service import listing_service
from src.models import ApiEnvelope

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ApiEnvelope[list[Listing]], summary="List open listings")
async def list_listings() -> ApiEnvelope[list[Listing]]:
    return ApiEnvelope(data=listing_service.list_listings())


@router.get("/{listing_id}", response_model=ApiEnvelope[Listing], summary="Get listing")
async def get_listing(listing_id: str) -> ApiEnvelope[Listing]:
    return ApiEnvelope(data=listing_service.get_listing(listing_id))


@router.post(
    "",
    response_model=ApiEnvelope[Listing],
    status_code=status.HTTP_201_CREATED,
    summary="Create listing",
)
async def create_listing(payload: ListingCreate, current_user: CurrentUser) -> ApiEnvelope[Listing]:
    return ApiEnvelope(
        data=listing_service.create_listing(payload, current_user.id),
        message="Listing created.",
    )
