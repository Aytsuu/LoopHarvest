from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from pydantic import Field

from src.models import ApiModel


class RequestBase(ApiModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    category_slug: str = Field(min_length=1, max_length=64)
    quantity_kg_min: Decimal | None = Field(default=None, gt=0)
    quantity_kg_max: Decimal | None = Field(default=None, gt=0)
    frequency: str = Field(default="one-time", min_length=1, max_length=32)
    city: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=120)
    max_distance_km: Decimal = Field(default=Decimal("10"), gt=0)

class RequestCreate(RequestBase):
    pass


class Request(RequestBase):
    id: UUID = Field(default_factory=uuid4)
    requester_id: UUID
    status: str = "open"
    created_at: datetime = Field(default_factory=datetime.utcnow)
