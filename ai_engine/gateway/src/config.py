"""
Module: config.py
Purpose: Application configuration and settings management

This module defines environment-backed settings for the AI gateway.
"""

from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = "LoopHarvest AI Gateway"
    app_version: str = "1.0.0"
    ollama_url: str = Field(default="http://ollama:11434", alias="OLLAMA_URL")
    api_key: str = Field(alias="MY_API_KEY")
    default_model: str = Field(default="qwen2.5:3b", alias="DEFAULT_MODEL")
    fallback_model: str = Field(default="gemma3:4b", alias="FALLBACK_MODEL")
    vision_model: str = Field(default="gemini-2.5-flash", alias="VISION_MODEL")
    google_ai_studio_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GOOGLE_AI_STUDIO_API_KEY", "GEMINI_API_KEY"),
    )
    google_ai_studio_base_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta",
        alias="GOOGLE_AI_STUDIO_BASE_URL",
    )
    request_timeout_seconds: float = Field(default=120.0, alias="REQUEST_TIMEOUT_SECONDS")


@lru_cache
def get_settings() -> Settings:
    return Settings()
