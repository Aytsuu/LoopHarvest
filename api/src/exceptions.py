from fastapi import HTTPException, status

from src.models import ErrorDetail


class ApiException(HTTPException):
    def __init__(self, *, status_code: int, code: str, message: str) -> None:
        super().__init__(
            status_code=status_code,
            detail=ErrorDetail(code=code, message=message).model_dump(),
        )


class NotFoundException(ApiException):
    def __init__(self, resource: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="not_found",
            message=f"{resource} was not found.",
        )
