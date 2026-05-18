from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class ApiEnvelope(ApiModel, Generic[T]):
    success: bool = True
    data: T
    message: str | None = None


class ErrorDetail(ApiModel):
    code: str
    message: str


class ErrorEnvelope(ApiModel):
    success: bool = False
    error: ErrorDetail
