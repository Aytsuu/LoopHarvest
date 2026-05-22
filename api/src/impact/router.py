from fastapi import APIRouter

from src.impact.schemas import ImpactSummary
from src.impact.service import impact_service
from src.models import ApiEnvelope

router = APIRouter(prefix="/impact", tags=["impact"])


@router.get("/summary", response_model=ApiEnvelope[ImpactSummary], summary="Get impact summary")
async def get_impact_summary() -> ApiEnvelope[ImpactSummary]:
    return ApiEnvelope(data=await impact_service.get_summary())
