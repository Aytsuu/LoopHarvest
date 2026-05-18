from collections.abc import Mapping

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
        if not self._jwks_client or not self._settings.supabase_jwt_issuer:
            raise ApiException(
                status_code=503,
                code="supabase_not_configured",
                message="Supabase auth is not configured on the API server.",
            )

        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience="authenticated",
                issuer=self._settings.supabase_jwt_issuer,
            )
        except InvalidTokenError as exc:
            raise ApiException(
                status_code=401,
                code="invalid_token",
                message="The supplied access token is invalid or expired.",
            ) from exc

        metadata = payload.get("user_metadata", {})
        display_name = None
        if isinstance(metadata, Mapping):
            display_name = metadata.get("full_name") or metadata.get("name")

        return AuthenticatedUser(
            id=payload["sub"],
            email=payload["email"],
            role=payload.get("role", "authenticated"),
            display_name=display_name,
        )


token_verifier = SupabaseTokenVerifier(get_settings())
