from fastapi import APIRouter

from src.auth.dependencies import CurrentUser
from src.matches.schemas import PersonalizedMatches
from src.matches.service import match_service
from src.models import ApiEnvelope

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/me", response_model=ApiEnvelope[PersonalizedMatches], summary="Get personalized matches")
async def get_personalized_matches(current_user: CurrentUser) -> ApiEnvelope[PersonalizedMatches]:
    return ApiEnvelope(data=await match_service.get_personalized_matches(current_user))
