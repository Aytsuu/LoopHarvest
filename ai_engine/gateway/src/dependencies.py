from fastapi import HTTPException, status

from src.config import Settings
from src.models import ErrorDetail


def verify_api_key(x_api_key: str | None, settings: Settings) -> None:
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ErrorDetail(code="unauthorized", message="Invalid API key.").model_dump(),
        )
