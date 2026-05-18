from fastapi import APIRouter

from src.models import ApiEnvelope, ApiModel

router = APIRouter(tags=["health"])


class HealthStatus(ApiModel):
    status: str
    service: str


@router.get(
    "/health",
    response_model=ApiEnvelope[HealthStatus],
    summary="Health check",
)
async def health_check() -> ApiEnvelope[HealthStatus]:
    return ApiEnvelope(
        data=HealthStatus(
            status="ok",
            service="loop-harvest-api",
        )
    )
