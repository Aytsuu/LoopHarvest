from fastapi import APIRouter, Depends, Request

from src.dependencies import verify_api_key
from src.models import VisionRequest
from src.service import post_chat_with_fallback
from src.utils.image import to_base64

router = APIRouter()


@router.post("/v1/vision")
async def vision(body: VisionRequest, request: Request, _: None = Depends(verify_api_key)):
    settings = request.app.state.settings

    images_b64 = []
    for img in body.images:
        b64 = await to_base64(img.source)
        images_b64.append(b64)

    selected_model = body.model or settings.vision_model
    payload = {
        "stream": False,
        "messages": [
            {
                "role": "user",
                "content": body.prompt,
                "images": images_b64,
            }
        ],
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
        "images_processed": len(images_b64),
    }
