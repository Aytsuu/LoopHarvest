from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials

from src.auth.dependencies import CurrentUser, bearer_scheme
from src.auth.schemas import AuthenticatedUser, AuthenticatedUserUpdate
from src.auth.service import profile_service
from src.models import ApiEnvelope

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ApiEnvelope[AuthenticatedUser], summary="Get current user")
async def get_me(current_user: CurrentUser) -> ApiEnvelope[AuthenticatedUser]:
    return ApiEnvelope(data=await profile_service.get_current_user(current_user))


@router.patch("/me", response_model=ApiEnvelope[AuthenticatedUser], summary="Update current user profile")
async def update_me(
    payload: AuthenticatedUserUpdate,
    current_user: CurrentUser,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> ApiEnvelope[AuthenticatedUser]:
    access_token = credentials.credentials if credentials is not None else ""
    return ApiEnvelope(
        data=await profile_service.update_current_user(
            access_token=access_token,
            current_user=current_user,
            payload=payload,
        ),
        message="Profile updated.",
    )
