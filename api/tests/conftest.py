import pytest
from httpx import ASGITransport, AsyncClient

from src.listings.service import InMemoryListingRepository, listing_service
from src.main import app
from src.requests.service import InMemoryRequestRepository, request_service
from src.categories.service import InMemoryCategoryRepository, category_service


@pytest.fixture(autouse=True)
def reset_state() -> None:
    original_listing_repository = listing_service._repository
    original_request_repository = request_service._repository
    original_category_repository = category_service._repository

    listing_service._repository = InMemoryListingRepository()
    request_service._repository = InMemoryRequestRepository()
    category_service._repository = InMemoryCategoryRepository()

    yield

    listing_service._repository = original_listing_repository
    request_service._repository = original_request_repository
    category_service._repository = original_category_repository


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
