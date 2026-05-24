from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.models import ApiModel


class SurveyNotificationChannels(ApiModel):
    push: bool
    email: bool


class SurveyNotifications(ApiModel):
    channels: SurveyNotificationChannels
    frequency: str = Field(pattern="^(instant|daily|weekly)$")


class UserSurveyPayload(ApiModel):
    purpose: list[str] = Field(default_factory=list, max_length=8)
    role: str = Field(pattern="^(donor|recipient|both|observer)$")
    waste_types: list[str] = Field(default_factory=list, max_length=10)
    frequency: str = Field(pattern="^(daily|weekly|monthly|seasonal)$")
    location_radius: int = Field(ge=1, le=50)
    goals: list[str] = Field(default_factory=list, max_length=3)
    ai_consent: dict[str, bool]
    notifications: SurveyNotifications


class UserSurvey(UserSurveyPayload):
    user_id: UUID
    created_at: datetime
    updated_at: datetime
