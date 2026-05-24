from datetime import datetime
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
    state_region: str | None = None
    postal_code: str | None = None
    country: str | None = None
    bio: str | None = None
    created_at: datetime | None = None


class AuthenticatedUserUpdate(ApiModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=2048)
    city: str | None = Field(default=None, max_length=120)
    state_region: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=32)
    country: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=400)
