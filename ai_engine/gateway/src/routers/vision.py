"""
Module: vision.py
Purpose: Vision API route handlers

This module defines the FastAPI endpoint for image-aware vision requests.
"""

import logging
from time import perf_counter

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from src.dependencies import verify_api_key
from src.models import VisionRequest
from src.service import post_google_vision_generate_content
from src.utils.image import detect_media_type, to_base64

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/v1/vision")
async def vision(body: VisionRequest, request: Request, _: None = Depends(verify_api_key)):
    settings = request.app.state.settings
    route_started_at = perf_counter()
    logger.info(
        "Vision request received model=%s prompt_length=%s image_count=%s",
        body.model or settings.vision_model,
        len(body.prompt),
        len(body.images),
    )

    images_b64 = []
    images_for_gemini = []
    try:
        for index, img in enumerate(body.images, start=1):
            image_started_at = perf_counter()
            logger.info("Processing vision image %s source=%s", index, img.source)
            b64 = await to_base64(img.source)
            images_b64.append(b64)
            images_for_gemini.append(
                {
                    "mime_type": img.media_type or detect_media_type(img.source),
                    "data": b64,
                }
            )
            logger.info(
                "Processed vision image %s bytes_base64=%s elapsed_ms=%.1f",
                index,
                len(b64),
                (perf_counter() - image_started_at) * 1000,
            )
    except FileNotFoundError as exc:
        logger.error("Vision image file not found source=%s error=%r", img.source, exc)
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Image source could not be read.",
                "message": str(exc),
            },
        ) from exc
    except (OSError, ValueError, httpx.HTTPError) as exc:
        logger.error(
            "Vision image processing failed source=%s (%s): %r",
            img.source,
            exc.__class__.__name__,
            exc,
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Image source could not be processed.",
                "message": str(exc),
            },
        ) from exc

    selected_model = body.model or settings.vision_model
    if not settings.google_ai_studio_api_key:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Vision provider is not configured.",
                "message": "Set GOOGLE_AI_STUDIO_API_KEY or GEMINI_API_KEY for /v1/vision.",
            },
        )

    client = request.app.state.ollama_client
    logger.info(
        "Dispatching Gemini vision request model=%s image_count=%s total_base64_bytes=%s elapsed_ms=%.1f",
        selected_model,
        len(images_for_gemini),
        sum(len(image["data"]) for image in images_for_gemini),
        (perf_counter() - route_started_at) * 1000,
    )
    data = await post_google_vision_generate_content(
        client=client,
        base_url=settings.google_ai_studio_base_url,
        api_key=settings.google_ai_studio_api_key,
        model=selected_model,
        prompt=body.prompt,
        images=images_for_gemini,
        system_instruction=body.system,
        temperature=body.temperature,
        max_output_tokens=body.max_tokens,
    )
    logger.info(
        "Vision upstream request completed model=%s total_elapsed_ms=%.1f",
        data["model"],
        (perf_counter() - route_started_at) * 1000,
    )

    return {
        "model": data["model"],
        "content": data["content"],
        "images_processed": len(images_for_gemini),
    }
