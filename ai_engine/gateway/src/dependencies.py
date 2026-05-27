"""
Module: dependencies.py
Purpose: Shared FastAPI dependency functions

This module provides request dependencies such as API key verification.
"""

from fastapi import Depends, Header, HTTPException, status

from src.config import Settings, get_settings
from src.models import ErrorDetail


def verify_api_key(
    x_api_key: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ErrorDetail(code="unauthorized", message="Invalid API key.").model_dump(),
        )
