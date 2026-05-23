from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID, uuid4

from pydantic import Field

from src.models import ApiModel


class ListingBase(ApiModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    category_slug: str = Field(min_length=1, max_length=64)
    quantity_kg: Decimal = Field(gt=0)
    claim_type: Literal["direct", "message"] = "direct"
    photo_url: str | None = Field(default=None, max_length=2048)
    pickup_address: str = Field(min_length=1, max_length=240)
    city: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=120)
    pickup_window_start: datetime | None = None
    pickup_window_end: datetime | None = None

class ListingCreate(ListingBase):
    pass


class Listing(ListingBase):
    id: UUID = Field(default_factory=uuid4)
    donor_id: UUID
    donor_name: str | None = None
    donor_avatar_url: str | None = None
    claimed_by: UUID | None = None
    status: Literal["open", "claimed", "completed"] = "open"
    donor_confirmed_at: datetime | None = None
    recipient_confirmed_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
