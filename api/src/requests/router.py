from fastapi import APIRouter, status

from src.auth.dependencies import CurrentUser
from src.models import ApiEnvelope
from src.requests.schemas import Request, RequestCreate
from src.requests.service import request_service

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("", response_model=ApiEnvelope[list[Request]], summary="List open requests")
async def list_requests() -> ApiEnvelope[list[Request]]:
    return ApiEnvelope(data=await request_service.list_requests())


@router.get("/{request_id}", response_model=ApiEnvelope[Request], summary="Get request")
async def get_request(request_id: str) -> ApiEnvelope[Request]:
    return ApiEnvelope(data=await request_service.get_request(request_id))


@router.post(
    "",
    response_model=ApiEnvelope[Request],
    status_code=status.HTTP_201_CREATED,
    summary="Create request",
)
async def create_request(payload: RequestCreate, current_user: CurrentUser) -> ApiEnvelope[Request]:
    return ApiEnvelope(
        data=await request_service.create_request(payload, current_user.id),
        message="Request created.",
    )


@router.post(
    "/{request_id}/fulfill",
    response_model=ApiEnvelope[Request],
    summary="Fulfill request",
)
async def fulfill_request(request_id: str, current_user: CurrentUser) -> ApiEnvelope[Request]:
    return ApiEnvelope(
        data=await request_service.fulfill_request(request_id),
        message="Request fulfilled.",
    )
