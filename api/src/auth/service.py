from collections.abc import Mapping

import httpx
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

from src.auth.schemas import AuthenticatedUser
from src.config import Settings, get_settings
from src.exceptions import ApiException


class SupabaseTokenVerifier:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._jwks_client = (
            PyJWKClient(settings.supabase_jwks_url) if settings.supabase_jwks_url else None
        )

    def verify_access_token(self, token: str) -> AuthenticatedUser:
        if not self._settings.supabase_project_url:
            raise ApiException(
                status_code=503,
                code="supabase_not_configured",
                message="Supabase auth is not configured on the API server.",
            )

        try:
            if self._jwks_client and self._settings.supabase_jwt_issuer:
                signing_key = self._jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience="authenticated",
                    issuer=self._settings.supabase_jwt_issuer,
                )
                return self._build_user_from_claims(payload)
        except InvalidTokenError:
            pass
        except Exception:
            pass

        return self._verify_with_supabase_user_endpoint(token)

    def _verify_with_supabase_user_endpoint(self, token: str) -> AuthenticatedUser:
        api_key = self._settings.supabase_publishable_key or self._settings.supabase_service_role_key
        if not api_key or not self._settings.supabase_project_url:
            raise ApiException(
                status_code=503,
                code="supabase_not_configured",
                message="Supabase auth is not configured on the API server.",
            )

        try:
            response = httpx.get(
                f"{self._settings.supabase_project_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": api_key,
                    "Authorization": f"Bearer {token}",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise ApiException(
                status_code=401,
                code="invalid_token",
                message="The supplied access token is invalid or expired.",
            ) from exc

        claims = {
            "sub": payload["id"],
            "email": payload["email"],
            "role": payload.get("role", "authenticated"),
            "user_metadata": payload.get("user_metadata", {}),
        }
        return self._build_user_from_claims(claims)

    def _build_user_from_claims(self, payload: Mapping[str, object]) -> AuthenticatedUser:
        metadata = payload.get("user_metadata", {})
        display_name = None
        avatar_url = None
        city = None
        country = None
        if isinstance(metadata, Mapping):
            display_name = (
                metadata.get("display_name")
                or metadata.get("full_name")
                or metadata.get("name")
            )
            avatar_url = metadata.get("avatar_url")
            city = metadata.get("city")
            country = metadata.get("country")

        return AuthenticatedUser(
            id=payload["sub"],
            email=payload["email"],
            role=str(payload.get("role", "authenticated")),
            display_name=display_name,
            avatar_url=avatar_url,
            city=city,
            country=country,
        )


token_verifier = SupabaseTokenVerifier(get_settings())
