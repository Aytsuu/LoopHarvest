from uuid import UUID

from pydantic import EmailStr, Field

from src.models import ApiModel


class AuthenticatedUser(ApiModel):
    id: UUID
    email: EmailStr
    role: str = Field(default="authenticated")
    display_name: str | None = None
    avatar_url: str | None = None
    city: str | None = None
    country: str | None = None
