from fastapi import HTTPException
import httpx

FALLBACK_STATUS_CODES = {404, 500, 502, 503, 504}


def _raise_upstream_error(exc: httpx.HTTPStatusError) -> None:
    detail: str | dict
    try:
        payload = exc.response.json()
        detail = payload if isinstance(payload, dict) else {"message": str(payload)}
    except ValueError:
        detail = {"message": exc.response.text or "Upstream model request failed."}

    raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc

async def post_chat_with_fallback(
    *,
    client: httpx.AsyncClient,
    payload: dict,
    primary_model: str,
    fallback_model: str,
    allow_fallback: bool,
) -> dict:
    primary_payload = {**payload, "model": primary_model}

    try:
        response = await client.post("/api/chat", json=primary_payload)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        if (
            not allow_fallback
            or primary_model == fallback_model
            or exc.response.status_code not in FALLBACK_STATUS_CODES
        ):
            _raise_upstream_error(exc)

    fallback_payload = {**payload, "model": fallback_model}
    try:
        fallback_response = await client.post("/api/chat", json=fallback_payload)
        fallback_response.raise_for_status()
        return fallback_response.json()
    except httpx.HTTPStatusError as exc:
        _raise_upstream_error(exc)
