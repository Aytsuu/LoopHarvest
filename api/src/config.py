from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.supabase_url import normalize_supabase_project_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="LOOPHARVEST_",
        env_file=".env",
        extra="ignore",
    )

    environment: str = "local"
    app_name: str = "LoopHarvest API"
    api_prefix: str = "/api/v1"
    show_docs: bool = True
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_service_role_key: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def docs_url(self) -> str | None:
        return "/docs" if self.show_docs else None

    @property
    def openapi_url(self) -> str | None:
        return "/openapi.json" if self.show_docs else None

    @property
    def supabase_jwt_issuer(self) -> str | None:
        project_url = normalize_supabase_project_url(self.supabase_url)
        if not project_url:
            return None
        return f"{project_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str | None:
        issuer = self.supabase_jwt_issuer
        if not issuer:
            return None
        return f"{issuer}/.well-known/jwks.json"

    @property
    def supabase_project_url(self) -> str | None:
        return normalize_supabase_project_url(self.supabase_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
