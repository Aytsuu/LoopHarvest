from fastapi import APIRouter

from src.auth.dependencies import CurrentUser
from src.auth.schemas import AuthenticatedUser
from src.models import ApiEnvelope

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ApiEnvelope[AuthenticatedUser], summary="Get current user")
async def get_me(current_user: CurrentUser) -> ApiEnvelope[AuthenticatedUser]:
    return ApiEnvelope(data=current_user)
