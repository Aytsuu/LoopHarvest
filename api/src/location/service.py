from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
from math import asin, cos, radians, sin, sqrt


@dataclass(frozen=True)
class InferredCoordinates:
    latitude: Decimal
    longitude: Decimal


KNOWN_CITY_COORDS: dict[str, tuple[Decimal, Decimal]] = {
    "san francisco": (Decimal("37.7749"), Decimal("-122.4194")),
    "london": (Decimal("51.5074"), Decimal("-0.1278")),
    "tokyo": (Decimal("35.6762"), Decimal("139.6503")),
    "sydney": (Decimal("-33.8688"), Decimal("151.2093")),
    "new york": (Decimal("40.7128"), Decimal("-74.0060")),
    "sao paulo": (Decimal("-23.5505"), Decimal("-46.6333")),
    "são paulo": (Decimal("-23.5505"), Decimal("-46.6333")),
    "paris": (Decimal("48.8566"), Decimal("2.3522")),
    "manila": (Decimal("14.5995"), Decimal("120.9842")),
    "quezon city": (Decimal("14.6760"), Decimal("121.0437")),
    "makati": (Decimal("14.5547"), Decimal("121.0244")),
    "pasig": (Decimal("14.5764"), Decimal("121.0851")),
    "taguig": (Decimal("14.5176"), Decimal("121.0509")),
    "cebu city": (Decimal("10.3157"), Decimal("123.8854")),
    "davao city": (Decimal("7.1907"), Decimal("125.4553")),
}


class LocationService:
    def infer_coordinates(
        self,
        *,
        city: str,
        country: str | None,
        detail: str,
    ) -> InferredCoordinates:
        normalized_city = city.strip().lower()
        base_latitude, base_longitude = KNOWN_CITY_COORDS.get(
            normalized_city,
            self._fallback_city_coordinates(city, country),
        )
        latitude_offset, longitude_offset = self._build_offsets(city=city, country=country, detail=detail)
        latitude = (base_latitude + latitude_offset).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
        longitude = (base_longitude + longitude_offset).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
        return InferredCoordinates(latitude=latitude, longitude=longitude)

    def distance_km(
        self,
        latitude_a: Decimal | None,
        longitude_a: Decimal | None,
        latitude_b: Decimal | None,
        longitude_b: Decimal | None,
    ) -> Decimal | None:
        if None in {latitude_a, longitude_a, latitude_b, longitude_b}:
            return None

        earth_radius_km = 6371.0088
        lat1 = radians(float(latitude_a))
        lon1 = radians(float(longitude_a))
        lat2 = radians(float(latitude_b))
        lon2 = radians(float(longitude_b))
        delta_lat = lat2 - lat1
        delta_lon = lon2 - lon1
        haversine = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
        distance = 2 * earth_radius_km * asin(sqrt(haversine))
        return Decimal(str(distance)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _fallback_city_coordinates(self, city: str, country: str | None) -> tuple[Decimal, Decimal]:
        digest = sha256(f"{city}|{country or ''}".encode("utf-8")).digest()
        lat_ratio = int.from_bytes(digest[:8], "big") / 2**64
        lon_ratio = int.from_bytes(digest[8:16], "big") / 2**64
        latitude = Decimal(str(-55 + (lat_ratio * 110)))
        longitude = Decimal(str(-170 + (lon_ratio * 340)))
        return latitude.quantize(Decimal("0.0001")), longitude.quantize(Decimal("0.0001"))

    def _build_offsets(self, *, city: str, country: str | None, detail: str) -> tuple[Decimal, Decimal]:
        digest = sha256(f"{city}|{country or ''}|{detail}".encode("utf-8")).digest()
        lat_ratio = int.from_bytes(digest[16:24], "big") / 2**64
        lon_ratio = int.from_bytes(digest[24:32], "big") / 2**64
        latitude_offset = Decimal(str((lat_ratio - 0.5) * 0.08))
        longitude_offset = Decimal(str((lon_ratio - 0.5) * 0.08))
        return (
            latitude_offset.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP),
            longitude_offset.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP),
        )


location_service = LocationService()
