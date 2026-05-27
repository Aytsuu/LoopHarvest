"""
Module: image.py
Purpose: Image encoding helper functions

This module converts image inputs into base64 for upstream vision requests.
"""

import base64, httpx
from pathlib import Path

async def to_base64(source: str) -> str:
    """Accept a URL, file path, or raw base64 string — always return base64."""
    
    # Already base64
    if source.startswith("data:image"):
        return source.split(",")[1]
    
    # Remote URL — download it
    if source.startswith("http"):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(source)
            return base64.b64encode(r.content).decode("utf-8")
    
    # Local file path
    return base64.b64encode(Path(source).read_bytes()).decode("utf-8")

def detect_media_type(source: str) -> str:
    if source.startswith("data:image/") and ";" in source:
        return source.split(";", 1)[0].replace("data:", "", 1)
    if ".png" in source:  return "image/png"
    if ".gif" in source:  return "image/gif"
    if ".webp" in source: return "image/webp"
    return "image/jpeg"   # safe default
