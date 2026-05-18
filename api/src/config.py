from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_service_role_key: str | None = None

    @property
    def docs_url(self) -> str | None:
        return "/docs" if self.show_docs else None

    @property
    def openapi_url(self) -> str | None:
        return "/openapi.json" if self.show_docs else None

    @property
    def supabase_jwt_issuer(self) -> str | None:
        if not self.supabase_url:
            return None
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str | None:
        issuer = self.supabase_jwt_issuer
        if not issuer:
            return None
        return f"{issuer}/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
