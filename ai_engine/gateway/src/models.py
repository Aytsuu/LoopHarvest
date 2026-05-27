"""
Module: models.py
Purpose: Request and response data models

This module defines Pydantic models used by the AI gateway endpoints.
"""

from typing import Any, Literal, Optional, List

from pydantic import BaseModel, Field

class ImageInput(BaseModel):
    source: str          # URL, base64, or file path
    media_type: Optional[str] = None

class VisionRequest(BaseModel):
    prompt: str
    images: List[ImageInput]
    model: Optional[str] = None
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    system: Optional[str] = None

class ChatRequest(BaseModel):
    messages: list
    model: Optional[str] = None
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    system: Optional[str] = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class SuccessEnvelope(BaseModel):
    success: Literal[True] = True
    data: dict[str, Any]


class ErrorEnvelope(BaseModel):
    success: Literal[False] = False
    error: ErrorDetail


class ChatMessage(BaseModel):
    role: str = Field(min_length=1, max_length=32)
    content: str = Field(min_length=1)
