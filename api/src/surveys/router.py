from fastapi import APIRouter, status

from src.auth.dependencies import CurrentUser
from src.models import ApiEnvelope
from src.surveys.schemas import UserSurvey, UserSurveyPayload
from src.surveys.service import survey_service

router = APIRouter(prefix="/survey", tags=["survey"])


@router.get("/me", response_model=ApiEnvelope[UserSurvey | None], summary="Get current user survey")
async def get_my_survey(current_user: CurrentUser) -> ApiEnvelope[UserSurvey | None]:
    return ApiEnvelope(data=await survey_service.get_current_user_survey(current_user))


@router.put(
    "/me",
    response_model=ApiEnvelope[UserSurvey],
    status_code=status.HTTP_200_OK,
    summary="Create or update current user survey",
)
async def put_my_survey(
    payload: UserSurveyPayload,
    current_user: CurrentUser,
) -> ApiEnvelope[UserSurvey]:
    return ApiEnvelope(
        data=await survey_service.save_current_user_survey(current_user, payload),
        message="Survey saved.",
    )
