from __future__ import annotations

from collections.abc import Mapping
from uuid import UUID

from src.config import Settings, get_settings
from src.exceptions import ApiException, NotFoundException
from src.location.service import location_service
from src.requests.schemas import Request, RequestCreate
from src.supabase_rest import SupabaseRestClient


class RequestRepository:
    async def list_requests(self) -> list[Request]:
        raise NotImplementedError

    async def create_request(self, payload: RequestCreate, requester_id: UUID) -> Request:
        raise NotImplementedError

    async def get_request(self, request_id: str) -> Request:
        raise NotImplementedError

    async def fulfill_request(self, request_id: str, actor_id: UUID) -> Request:
        raise NotImplementedError

    async def close_request(self, request_id: str, actor_id: UUID) -> Request:
        raise NotImplementedError

    async def cancel_fulfillment(self, request_id: str, actor_id: UUID) -> Request:
        raise NotImplementedError


class InMemoryRequestRepository(RequestRepository):
    def __init__(self) -> None:
        self._requests: list[Request] = []

    async def list_requests(self) -> list[Request]:
        return list(self._requests)

    async def create_request(self, payload: RequestCreate, requester_id: UUID) -> Request:
        coordinates = location_service.infer_coordinates(
            city=payload.city,
            country=payload.country,
            detail=f"{payload.title}|{payload.description or ''}",
        )
        request = Request(
            **payload.model_dump(exclude={"location_latitude", "location_longitude"}),
            requester_id=requester_id,
            requester_name="Current User",
            fulfilled_by=None,
            location_latitude=coordinates.latitude,
            location_longitude=coordinates.longitude,
        )
        self._requests.insert(0, request)
        return request

    async def get_request(self, request_id: str) -> Request:
        for request in self._requests:
            if str(request.id) == request_id:
                return request
        raise NotFoundException("Request")

    async def fulfill_request(self, request_id: str, actor_id: UUID) -> Request:
        for index, request in enumerate(self._requests):
            if str(request.id) != request_id:
                continue
            if request.status != "open":
                raise ApiException(
                    status_code=409,
                    code="request_unavailable",
                    message="This request is no longer open.",
                )
            updated_request = request.model_copy(update={"status": "fulfilled", "fulfilled_by": actor_id})
            self._requests[index] = updated_request
            return updated_request
        raise NotFoundException("Request")

    async def close_request(self, request_id: str, actor_id: UUID) -> Request:
        for index, request in enumerate(self._requests):
            if str(request.id) != request_id:
                continue
            if request.status != "fulfilled":
                raise ApiException(
                    status_code=409,
                    code="request_not_ready_to_close",
                    message="Only requests already being fulfilled can close the loop.",
                )
            if request.requester_id != actor_id:
                raise ApiException(
                    status_code=403,
                    code="request_closure_forbidden",
                    message="Only the requester can close this loop.",
                )
            updated_request = request.model_copy(update={"status": "closed"})
            self._requests[index] = updated_request
            return updated_request
        raise NotFoundException("Request")

    async def cancel_fulfillment(self, request_id: str, actor_id: UUID) -> Request:
        for index, request in enumerate(self._requests):
            if str(request.id) != request_id:
                continue
            if request.status != "fulfilled":
                raise ApiException(
                    status_code=409,
                    code="request_fulfillment_not_cancellable",
                    message="Only requests in fulfillment can be reopened.",
                )
            allowed_actor_ids = {request.requester_id}
            if request.fulfilled_by is not None:
                allowed_actor_ids.add(request.fulfilled_by)
            if actor_id not in allowed_actor_ids:
                raise ApiException(
                    status_code=403,
                    code="request_fulfillment_cancellation_forbidden",
                    message="You are not allowed to cancel this fulfillment.",
                )
            updated_request = request.model_copy(update={"status": "open", "fulfilled_by": None})
            self._requests[index] = updated_request
            return updated_request
        raise NotFoundException("Request")

    def reset(self) -> None:
        self._requests.clear()


class SupabaseRequestRepository(RequestRepository):
    def __init__(self, settings: Settings) -> None:
        self._rest = SupabaseRestClient(settings)

    async def list_requests(self) -> list[Request]:
        rows = await self._rest.select(
            "requests",
            columns=(
                "id,requester_id,title,description,category_slug,quantity_kg_min,"
                "quantity_kg_max,frequency,city,country,location_latitude,location_longitude,max_distance_km,fulfilled_by,status,created_at"
            ),
            order="created_at.desc",
        )
        return await self._enrich(rows)

    async def create_request(self, payload: RequestCreate, requester_id: UUID) -> Request:
        coordinates = location_service.infer_coordinates(
            city=payload.city,
            country=payload.country,
            detail=f"{payload.title}|{payload.description or ''}",
        )
        row = await self._rest.insert(
            "requests",
            {
                **payload.model_dump(mode="json"),
                "requester_id": str(requester_id),
                "location_latitude": str(coordinates.latitude),
                "location_longitude": str(coordinates.longitude),
            },
        )
        enriched = await self._enrich([row])
        return enriched[0]

    async def get_request(self, request_id: str) -> Request:
        rows = await self._rest.select(
            "requests",
            columns=(
                "id,requester_id,title,description,category_slug,quantity_kg_min,"
                "quantity_kg_max,frequency,city,country,location_latitude,location_longitude,max_distance_km,fulfilled_by,status,created_at"
            ),
            filters={"id": f"eq.{request_id}"},
        )
        if not rows:
            raise NotFoundException("Request")
        enriched = await self._enrich(rows)
        return enriched[0]

    async def fulfill_request(self, request_id: str, actor_id: UUID) -> Request:
        row = await self._rest.update(
            "requests",
            payload={"status": "fulfilled", "fulfilled_by": str(actor_id)},
            filters={"id": f"eq.{request_id}", "status": "eq.open"},
        )
        if row is None:
            current = await self._rest.select(
                "requests",
                columns="id,status",
                filters={"id": f"eq.{request_id}"},
            )
            if not current:
                raise NotFoundException("Request")
            raise ApiException(
                status_code=409,
                code="request_unavailable",
                message="This request is no longer open.",
            )
        enriched = await self._enrich([row])
        return enriched[0]

    async def close_request(self, request_id: str, actor_id: UUID) -> Request:
        current_rows = await self._rest.select(
            "requests",
            columns=(
                "id,requester_id,title,description,category_slug,quantity_kg_min,"
                "quantity_kg_max,frequency,city,country,location_latitude,location_longitude,max_distance_km,fulfilled_by,status,created_at"
            ),
            filters={"id": f"eq.{request_id}"},
        )
        if not current_rows:
            raise NotFoundException("Request")

        current = current_rows[0]
        if current["status"] != "fulfilled":
            raise ApiException(
                status_code=409,
                code="request_not_ready_to_close",
                message="Only requests already being fulfilled can close the loop.",
            )
        if UUID(str(current["requester_id"])) != actor_id:
            raise ApiException(
                status_code=403,
                code="request_closure_forbidden",
                message="Only the requester can close this loop.",
            )

        row = await self._rest.update(
            "requests",
            payload={"status": "closed"},
            filters={"id": f"eq.{request_id}", "status": "eq.fulfilled"},
        )
        if row is None:
            raise ApiException(
                status_code=409,
                code="request_not_ready_to_close",
                message="Only requests already being fulfilled can close the loop.",
            )
        enriched = await self._enrich([row])
        return enriched[0]

    async def cancel_fulfillment(self, request_id: str, actor_id: UUID) -> Request:
        current_rows = await self._rest.select(
            "requests",
            columns=(
                "id,requester_id,title,description,category_slug,quantity_kg_min,"
                "quantity_kg_max,frequency,city,country,location_latitude,location_longitude,max_distance_km,fulfilled_by,status,created_at"
            ),
            filters={"id": f"eq.{request_id}"},
        )
        if not current_rows:
            raise NotFoundException("Request")

        current = current_rows[0]
        if current["status"] != "fulfilled":
            raise ApiException(
                status_code=409,
                code="request_fulfillment_not_cancellable",
                message="Only requests in fulfillment can be reopened.",
            )
        requester_id = UUID(str(current["requester_id"]))
        fulfilled_by_raw = current.get("fulfilled_by")
        fulfilled_by = UUID(str(fulfilled_by_raw)) if fulfilled_by_raw else None
        allowed_actor_ids = {requester_id}
        if fulfilled_by is not None:
            allowed_actor_ids.add(fulfilled_by)
        if actor_id not in allowed_actor_ids:
            raise ApiException(
                status_code=403,
                code="request_fulfillment_cancellation_forbidden",
                message="You are not allowed to cancel this fulfillment.",
            )

        row = await self._rest.update(
            "requests",
            payload={"status": "open", "fulfilled_by": None},
            filters={"id": f"eq.{request_id}", "status": "eq.fulfilled"},
        )
        if row is None:
            raise ApiException(
                status_code=409,
                code="request_fulfillment_not_cancellable",
                message="Only requests in fulfillment can be reopened.",
            )
        enriched = await self._enrich([row])
        return enriched[0]

    async def _enrich(self, rows: list[dict]) -> list[Request]:
        requester_ids = [row["requester_id"] for row in rows]
        user_rows = await self._rest.by_ids(
            "users",
            columns="id,display_name,avatar_url",
            ids=requester_ids,
        )
        users_by_id = {row["id"]: row for row in user_rows}
        return [self._map_row(row, users_by_id.get(row["requester_id"])) for row in rows]

    def _map_row(self, row: Mapping[str, object], user_row: Mapping[str, object] | None) -> Request:
        user_name = None
        avatar_url = None
        if user_row is not None:
            user_name = _as_str(user_row.get("display_name"))
            avatar_url = _as_str(user_row.get("avatar_url"))

        inferred_coordinates = None
        if row.get("location_latitude") is None or row.get("location_longitude") is None:
            inferred_coordinates = location_service.infer_coordinates(
                city=str(row["city"]),
                country=_as_str(row.get("country")),
                detail=f"{row['title']}|{row.get('description') or ''}",
            )

        return Request(
            id=row["id"],
            requester_id=row["requester_id"],
            requester_name=user_name,
            requester_avatar_url=avatar_url,
            fulfilled_by=row.get("fulfilled_by"),
            title=row["title"],
            description=row.get("description"),
            category_slug=row["category_slug"],
            quantity_kg_min=row.get("quantity_kg_min"),
            quantity_kg_max=row.get("quantity_kg_max"),
            frequency=row["frequency"],
            city=row["city"],
            country=row["country"],
            location_latitude=row.get("location_latitude") or (
                inferred_coordinates.latitude if inferred_coordinates is not None else None
            ),
            location_longitude=row.get("location_longitude") or (
                inferred_coordinates.longitude if inferred_coordinates is not None else None
            ),
            max_distance_km=row["max_distance_km"],
            status=row["status"],
            created_at=row["created_at"],
        )


class RequestService:
    def __init__(self, repository: RequestRepository) -> None:
        self._repository = repository

    async def list_requests(self) -> list[Request]:
        return await self._repository.list_requests()

    async def create_request(self, payload: RequestCreate, requester_id: UUID) -> Request:
        return await self._repository.create_request(payload, requester_id)

    async def get_request(self, request_id: str) -> Request:
        return await self._repository.get_request(request_id)

    async def fulfill_request(self, request_id: str, actor_id: UUID) -> Request:
        return await self._repository.fulfill_request(request_id, actor_id)

    async def close_request(self, request_id: str, actor_id: UUID) -> Request:
        return await self._repository.close_request(request_id, actor_id)

    async def cancel_fulfillment(self, request_id: str, actor_id: UUID) -> Request:
        return await self._repository.cancel_fulfillment(request_id, actor_id)


def _build_request_repository(settings: Settings) -> RequestRepository:
    if (
        settings.supabase_project_url
        and settings.supabase_service_role_key
    ):
        return SupabaseRequestRepository(settings)
    return InMemoryRequestRepository()


def _as_str(value: object | None) -> str | None:
    return value if isinstance(value, str) else None


request_service = RequestService(_build_request_repository(get_settings()))
