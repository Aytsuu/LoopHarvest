from __future__ import annotations

from collections.abc import Mapping, Sequence
from urllib.parse import quote

import httpx

from src.config import Settings
from src.exceptions import ApiException


class SupabaseRestClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.supabase_project_url or not settings.supabase_service_role_key:
            raise ValueError("Supabase REST client requires URL and service role key.")

        self._base_url = f"{settings.supabase_project_url.rstrip('/')}/rest/v1"
        self._service_role_key = settings.supabase_service_role_key
        self._schema = "api"

    async def select(
        self,
        table: str,
        *,
        columns: str,
        filters: Mapping[str, str] | None = None,
        order: str | None = None,
    ) -> list[dict]:
        params = self._build_params(filters=filters, order=order)
        response = await self._request(
            "GET",
            f"{table}?select={quote(columns, safe='*,()')}{params}",
            headers={"Accept-Profile": self._schema},
        )
        return response.json()

    async def insert(self, table: str, payload: Mapping[str, object]) -> dict:
        response = await self._request(
            "POST",
            table,
            headers={
                "Content-Profile": self._schema,
                "Prefer": "return=representation",
            },
            json=[payload],
        )
        data = response.json()
        return data[0]

    async def update(
        self,
        table: str,
        *,
        payload: Mapping[str, object],
        filters: Mapping[str, str],
    ) -> dict | None:
        params = self._build_params(filters=filters)
        response = await self._request(
            "PATCH",
            f"{table}?select=*&{params.lstrip('&')}",
            headers={
                "Content-Profile": self._schema,
                "Prefer": "return=representation",
            },
            json=payload,
        )
        data = response.json()
        if not data:
            return None
        return data[0]

    async def by_ids(
        self,
        table: str,
        *,
        columns: str,
        ids: Sequence[str],
        id_column: str = "id",
    ) -> list[dict]:
        if not ids:
            return []
        joined = ",".join(ids)
        filters = {id_column: f"in.({joined})"}
        return await self.select(table, columns=columns, filters=filters)

    def _build_params(
        self,
        *,
        filters: Mapping[str, str] | None = None,
        order: str | None = None,
    ) -> str:
        params: list[str] = []
        if filters:
            for key, value in filters.items():
                params.append(f"{key}={quote(value, safe='().,')}")
        if order:
            params.append(f"order={quote(order, safe='.,')}")
        if not params:
            return ""
        return "&" + "&".join(params)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        headers: Mapping[str, str] | None = None,
        json: object | None = None,
    ) -> httpx.Response:
        request_headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
        }
        if headers:
            request_headers.update(headers)

        async with httpx.AsyncClient(base_url=self._base_url, timeout=15.0) as client:
            response = await client.request(method, path, headers=request_headers, json=json)

        if response.is_success:
            return response

        message = "Supabase request failed."
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = None

        if isinstance(error_payload, Mapping):
            message = str(
                error_payload.get("message")
                or error_payload.get("error_description")
                or error_payload.get("hint")
                or message
            )

        raise ApiException(
            status_code=502,
            code="supabase_request_failed",
            message=message,
        )
