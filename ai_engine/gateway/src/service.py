"""
Module: service.py
Purpose: Upstream model request orchestration

This module handles chat requests to the upstream model service with fallback behavior.
"""

import logging

import httpx
from fastapi import HTTPException

FALLBACK_STATUS_CODES = {404, 500, 502, 503, 504}
logger = logging.getLogger(__name__)


def _raise_upstream_error(exc: httpx.HTTPStatusError) -> None:
    detail: str | dict
    try:
        payload = exc.response.json()
        detail = payload if isinstance(payload, dict) else {"message": str(payload)}
    except ValueError:
        detail = {"message": exc.response.text or "Upstream model request failed."}

    raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc


def _raise_transport_error(exc: httpx.RequestError) -> None:
    detail = {
        "error": "Upstream model request failed.",
        "message": str(exc),
    }
    raise HTTPException(status_code=502, detail=detail) from exc


def _extract_gemini_text(payload: dict) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        logger.error("Gemini response missing candidates: %r", payload)
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Upstream model returned an invalid response.",
                "message": "Gemini response did not include any candidates.",
            },
        )

    parts = candidates[0].get("content", {}).get("parts", [])
    if not isinstance(parts, list):
        logger.error("Gemini response had invalid parts payload: %r", payload)
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Upstream model returned an invalid response.",
                "message": "Gemini response parts were not in the expected format.",
            },
        )

    text_parts = [part.get("text", "") for part in parts if isinstance(part, dict) and part.get("text")]
    if not text_parts:
        logger.error("Gemini response did not include text parts: %r", payload)
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Upstream model returned an invalid response.",
                "message": "Gemini response did not include any text output.",
            },
        )

    return "\n".join(text_parts).strip()


async def post_google_vision_generate_content(
    *,
    client: httpx.AsyncClient,
    base_url: str,
    api_key: str,
    model: str,
    prompt: str,
    images: list[dict[str, str]],
    system_instruction: str | None,
    temperature: float | None,
    max_output_tokens: int | None,
) -> dict:
    request_payload: dict[str, object] = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    *[
                        {
                            "inline_data": {
                                "mime_type": image["mime_type"],
                                "data": image["data"],
                            }
                        }
                        for image in images
                    ],
                ]
            }
        ]
    }

    if system_instruction:
        request_payload["system_instruction"] = {
            "parts": [{"text": system_instruction}],
        }

    generation_config: dict[str, object] = {}
    if temperature is not None:
        generation_config["temperature"] = temperature
    if max_output_tokens is not None:
        generation_config["maxOutputTokens"] = max_output_tokens
    if generation_config:
        request_payload["generationConfig"] = generation_config

    endpoint = f"{base_url.rstrip('/')}/models/{model}:generateContent"
    logger.info("Posting Gemini vision request to model=%s image_count=%s", model, len(images))

    try:
        response = await client.post(
            endpoint,
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json",
            },
            json=request_payload,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        try:
            error_payload = exc.response.json()
        except ValueError:
            error_payload = exc.response.text
        logger.error(
            "Gemini vision request returned HTTP error for model=%s (%s): %r payload=%r",
            model,
            exc.__class__.__name__,
            exc,
            error_payload,
        )
        _raise_upstream_error(exc)
    except httpx.RequestError as exc:
        logger.error(
            "Gemini vision transport error for model=%s (%s): %r",
            model,
            exc.__class__.__name__,
            exc,
        )
        _raise_transport_error(exc)

    payload = response.json()
    return {
        "model": model,
        "content": _extract_gemini_text(payload),
        "raw_response": payload,
    }

async def post_chat_with_fallback(
    *,
    client: httpx.AsyncClient,
    payload: dict,
    primary_model: str,
    fallback_model: str,
    allow_fallback: bool,
) -> dict:
    primary_payload = {**payload, "model": primary_model}
    logger.info(
        "Posting upstream chat request to /api/chat with primary model=%s fallback_enabled=%s",
        primary_model,
        allow_fallback,
    )

    try:
        response = await client.post("/api/chat", json=primary_payload)
        response.raise_for_status()
        logger.info(
            "Upstream chat request succeeded with primary model=%s status=%s",
            primary_model,
            response.status_code,
        )
        return response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Upstream chat request returned HTTP error for primary model=%s (%s): %r",
            primary_model,
            exc.__class__.__name__,
            exc,
        )
        if (
            not allow_fallback
            or primary_model == fallback_model
            or exc.response.status_code not in FALLBACK_STATUS_CODES
        ):
            _raise_upstream_error(exc)
    except httpx.RequestError as exc:
        logger.error(
            "Upstream chat transport error for primary model=%s (%s): %r",
            primary_model,
            exc.__class__.__name__,
            exc,
        )
        _raise_transport_error(exc)

    fallback_payload = {**payload, "model": fallback_model}
    logger.info(
        "Retrying upstream chat request with fallback model=%s",
        fallback_model,
    )
    try:
        fallback_response = await client.post("/api/chat", json=fallback_payload)
        fallback_response.raise_for_status()
        logger.info(
            "Upstream chat request succeeded with fallback model=%s status=%s",
            fallback_model,
            fallback_response.status_code,
        )
        return fallback_response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Upstream chat request returned HTTP error for fallback model=%s (%s): %r",
            fallback_model,
            exc.__class__.__name__,
            exc,
        )
        _raise_upstream_error(exc)
    except httpx.RequestError as exc:
        logger.error(
            "Upstream chat transport error for fallback model=%s (%s): %r",
            fallback_model,
            exc.__class__.__name__,
            exc,
        )
        _raise_transport_error(exc)
