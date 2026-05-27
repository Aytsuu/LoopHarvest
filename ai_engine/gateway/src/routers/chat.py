"""
Module: chat.py
Purpose: Chat API route handlers

This module defines the FastAPI endpoint for text chat requests.
"""

from fastapi import APIRouter, Depends, Request

from src.dependencies import verify_api_key
from src.models import ChatRequest
from src.service import post_chat_with_fallback

router = APIRouter()


@router.post("/v1/chat")
async def chat(body: ChatRequest, request: Request, _: None = Depends(verify_api_key)):
    settings = request.app.state.settings
    selected_model = body.model or settings.default_model

    payload = {
        "messages": body.messages,
        "stream": False,
        "options": {
            "temperature": body.temperature,
            "num_predict": body.max_tokens,
        },
    }
    if body.system:
        payload["system"] = body.system

    client = request.app.state.ollama_client
    data = await post_chat_with_fallback(
        client=client,
        payload=payload,
        primary_model=selected_model,
        fallback_model=settings.fallback_model,
        allow_fallback=body.model is None,
    )

    return {
        "model": data.get("model"),
        "content": data.get("message", {}).get("content", ""),
    }
