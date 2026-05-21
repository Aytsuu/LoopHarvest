from typing import Any, Literal

from pydantic import BaseModel, Field


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


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    model: str | None = Field(default=None, min_length=1)
    max_tokens: int = Field(default=1024, ge=1, le=16384)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    system: str | None = Field(default=None, min_length=1)
