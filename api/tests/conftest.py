import pytest
from httpx import ASGITransport, AsyncClient

from src.listings.service import listing_service
from src.main import app
from src.requests.service import request_service


@pytest.fixture(autouse=True)
def reset_state() -> None:
    listing_service._listings.clear()
    request_service._requests.clear()


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
