from __future__ import annotations

from collections.abc import Mapping
from uuid import UUID

from src.config import Settings, get_settings
from src.exceptions import ApiException, NotFoundException
from src.listings.schemas import Listing, ListingCreate
from src.supabase_rest import SupabaseRestClient


class ListingRepository:
    async def list_listings(self) -> list[Listing]:
        raise NotImplementedError

    async def create_listing(self, payload: ListingCreate, donor_id: UUID) -> Listing:
        raise NotImplementedError

    async def get_listing(self, listing_id: str) -> Listing:
        raise NotImplementedError

    async def claim_listing(self, listing_id: str, claimer_id: UUID) -> Listing:
        raise NotImplementedError

    async def complete_listing(self, listing_id: str, actor_id: UUID) -> Listing:
        raise NotImplementedError


class InMemoryListingRepository(ListingRepository):
    def __init__(self) -> None:
        self._listings: list[Listing] = []

    async def list_listings(self) -> list[Listing]:
        return list(self._listings)

    async def create_listing(self, payload: ListingCreate, donor_id: UUID) -> Listing:
        listing = Listing(
            **payload.model_dump(),
            donor_id=donor_id,
            donor_name="Current User",
        )
        self._listings.insert(0, listing)
        return listing

    async def get_listing(self, listing_id: str) -> Listing:
        for listing in self._listings:
            if str(listing.id) == listing_id:
                return listing
        raise NotFoundException("Listing")

    async def claim_listing(self, listing_id: str, claimer_id: UUID) -> Listing:
        for index, listing in enumerate(self._listings):
            if str(listing.id) != listing_id:
                continue
            if listing.status != "open":
                raise ApiException(
                    status_code=409,
                    code="listing_unavailable",
                    message="This listing is no longer open.",
                )
            updated_listing = listing.model_copy(
                update={"status": "claimed", "claimed_by": claimer_id}
            )
            self._listings[index] = updated_listing
            return updated_listing
        raise NotFoundException("Listing")

    async def complete_listing(self, listing_id: str, actor_id: UUID) -> Listing:
        for index, listing in enumerate(self._listings):
            if str(listing.id) != listing_id:
                continue
            if listing.status == "completed":
                return listing
            claimed_by = listing.claimed_by
            if listing.status == "open":
                if listing.donor_id == actor_id:
                    raise ApiException(
                        status_code=409,
                        code="listing_completion_requires_recipient",
                        message="A recipient must complete this handoff.",
                    )
                claimed_by = actor_id
            elif listing.status == "claimed":
                allowed_actor_ids = {listing.donor_id}
                if listing.claimed_by is not None:
                    allowed_actor_ids.add(listing.claimed_by)
                if actor_id not in allowed_actor_ids:
                    raise ApiException(
                        status_code=403,
                        code="listing_completion_forbidden",
                        message="You are not allowed to complete this handoff.",
                    )

            updated_listing = listing.model_copy(
                update={"status": "completed", "claimed_by": claimed_by}
            )
            self._listings[index] = updated_listing
            return updated_listing
        raise NotFoundException("Listing")

    def reset(self) -> None:
        self._listings.clear()


class SupabaseListingRepository(ListingRepository):
    def __init__(self, settings: Settings) -> None:
        self._rest = SupabaseRestClient(settings)

    async def list_listings(self) -> list[Listing]:
        rows = await self._rest.select(
            "listings",
            columns=(
                "id,donor_id,title,description,category_slug,quantity_kg,claim_type,photo_url,"
                "pickup_address,city,country,pickup_window_start,pickup_window_end,"
                "status,claimed_by,created_at"
            ),
            order="created_at.desc",
        )
        return await self._enrich(rows)

    async def create_listing(self, payload: ListingCreate, donor_id: UUID) -> Listing:
        row = await self._rest.insert(
            "listings",
            {
                **payload.model_dump(mode="json"),
                "donor_id": str(donor_id),
            },
        )
        enriched = await self._enrich([row])
        return enriched[0]

    async def get_listing(self, listing_id: str) -> Listing:
        rows = await self._rest.select(
            "listings",
            columns=(
                "id,donor_id,title,description,category_slug,quantity_kg,claim_type,photo_url,"
                "pickup_address,city,country,pickup_window_start,pickup_window_end,"
                "status,claimed_by,created_at"
            ),
            filters={"id": f"eq.{listing_id}"},
        )
        if not rows:
            raise NotFoundException("Listing")
        enriched = await self._enrich(rows)
        return enriched[0]

    async def claim_listing(self, listing_id: str, claimer_id: UUID) -> Listing:
        row = await self._rest.update(
            "listings",
            payload={"status": "claimed", "claimed_by": str(claimer_id)},
            filters={"id": f"eq.{listing_id}", "status": "eq.open"},
        )
        if row is None:
            current = await self._rest.select(
                "listings",
                columns="id,status",
                filters={"id": f"eq.{listing_id}"},
            )
            if not current:
                raise NotFoundException("Listing")
            raise ApiException(
                status_code=409,
                code="listing_unavailable",
                message="This listing is no longer open.",
            )
        enriched = await self._enrich([row])
        return enriched[0]

    async def complete_listing(self, listing_id: str, actor_id: UUID) -> Listing:
        current_rows = await self._rest.select(
            "listings",
            columns=(
                "id,donor_id,title,description,category_slug,quantity_kg,claim_type,photo_url,"
                "pickup_address,city,country,pickup_window_start,pickup_window_end,"
                "status,claimed_by,created_at"
            ),
            filters={"id": f"eq.{listing_id}"},
        )
        if not current_rows:
            raise NotFoundException("Listing")

        current = current_rows[0]
        current_status = current["status"]
        donor_id = UUID(str(current["donor_id"]))
        claimed_by_raw = current.get("claimed_by")
        claimed_by = UUID(str(claimed_by_raw)) if claimed_by_raw else None

        if current_status == "completed":
            enriched = await self._enrich(current_rows)
            return enriched[0]

        update_payload: dict[str, object] = {"status": "completed"}
        if current_status == "open":
            if donor_id == actor_id:
                raise ApiException(
                    status_code=409,
                    code="listing_completion_requires_recipient",
                    message="A recipient must complete this handoff.",
                )
            update_payload["claimed_by"] = str(actor_id)
        elif current_status == "claimed":
            allowed_actor_ids = {donor_id}
            if claimed_by is not None:
                allowed_actor_ids.add(claimed_by)
            if actor_id not in allowed_actor_ids:
                raise ApiException(
                    status_code=403,
                    code="listing_completion_forbidden",
                    message="You are not allowed to complete this handoff.",
                )
        else:
            raise ApiException(
                status_code=409,
                code="listing_unavailable",
                message="This listing cannot be completed from its current state.",
            )

        row = await self._rest.update(
            "listings",
            payload=update_payload,
            filters={"id": f"eq.{listing_id}"},
        )
        if row is None:
            raise NotFoundException("Listing")
        enriched = await self._enrich([row])
        return enriched[0]

    async def _enrich(self, rows: list[dict]) -> list[Listing]:
        donor_ids = [row["donor_id"] for row in rows]
        user_rows = await self._rest.by_ids(
            "users",
            columns="id,display_name,avatar_url",
            ids=donor_ids,
        )
        users_by_id = {row["id"]: row for row in user_rows}
        return [self._map_row(row, users_by_id.get(row["donor_id"])) for row in rows]

    def _map_row(self, row: Mapping[str, object], user_row: Mapping[str, object] | None) -> Listing:
        user_name = None
        avatar_url = None
        if user_row is not None:
            user_name = _as_str(user_row.get("display_name"))
            avatar_url = _as_str(user_row.get("avatar_url"))

        return Listing(
            id=row["id"],
            donor_id=row["donor_id"],
            donor_name=user_name,
            donor_avatar_url=avatar_url,
            title=row["title"],
            description=row.get("description"),
            category_slug=row["category_slug"],
            quantity_kg=row["quantity_kg"],
            claim_type=row.get("claim_type", "direct"),
            photo_url=row.get("photo_url"),
            pickup_address=row["pickup_address"],
            city=row["city"],
            country=row["country"],
            pickup_window_start=row.get("pickup_window_start"),
            pickup_window_end=row.get("pickup_window_end"),
            status=row["status"],
            claimed_by=row.get("claimed_by"),
            created_at=row["created_at"],
        )


class ListingService:
    def __init__(self, repository: ListingRepository) -> None:
        self._repository = repository

    async def list_listings(self) -> list[Listing]:
        return await self._repository.list_listings()

    async def create_listing(self, payload: ListingCreate, donor_id: UUID) -> Listing:
        return await self._repository.create_listing(payload, donor_id)

    async def get_listing(self, listing_id: str) -> Listing:
        return await self._repository.get_listing(listing_id)

    async def claim_listing(self, listing_id: str, claimer_id: UUID) -> Listing:
        return await self._repository.claim_listing(listing_id, claimer_id)

    async def complete_listing(self, listing_id: str, actor_id: UUID) -> Listing:
        return await self._repository.complete_listing(listing_id, actor_id)


def _build_listing_repository(settings: Settings) -> ListingRepository:
    if (
        settings.supabase_project_url
        and settings.supabase_service_role_key
    ):
        return SupabaseListingRepository(settings)
    return InMemoryListingRepository()


def _as_str(value: object | None) -> str | None:
    return value if isinstance(value, str) else None


listing_service = ListingService(_build_listing_repository(get_settings()))
