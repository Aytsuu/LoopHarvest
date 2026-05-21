from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "LoopHarvest AI Gateway"
    app_version: str = "1.0.0"
    ollama_url: str = Field(default="http://ollama:11434", alias="OLLAMA_URL")
    api_key: str = Field(alias="MY_API_KEY")
    default_model: str = Field(default="qwen2.5:1.5b", alias="DEFAULT_MODEL")
    request_timeout_seconds: float = Field(default=120.0, alias="REQUEST_TIMEOUT_SECONDS")


@lru_cache
def get_settings() -> Settings:
    return Settings()
