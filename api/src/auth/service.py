from collections.abc import Mapping

import httpx
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

from src.auth.schemas import AuthenticatedUser, AuthenticatedUserUpdate
from src.config import Settings, get_settings
from src.exceptions import ApiException
from src.supabase_rest import SupabaseRestClient


def _derive_display_name_from_email(email: str | None) -> str | None:
    if not isinstance(email, str):
        return None

    local_part = email.strip().lower().partition("@")[0]
    if not local_part:
        return None

    normalized = " ".join(local_part.replace(".", " ").replace("_", " ").replace("-", " ").split())
    if not normalized:
        return None

    return normalized.title()


def _is_generated_avatar_url(value: object) -> bool:
    if not isinstance(value, str):
        return False

    return (
        "www.gravatar.com/avatar/" in value
        or "secure.gravatar.com/avatar/" in value
        or "api.dicebear.com" in value
        or "/avataaars/" in value
    )


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
            "created_at": payload.get("created_at"),
        }
        return self._build_user_from_claims(claims)

    def _build_user_from_claims(self, payload: Mapping[str, object]) -> AuthenticatedUser:
        metadata = payload.get("user_metadata", {})
        email = payload["email"] if isinstance(payload.get("email"), str) else None
        display_name = None
        avatar_url = None
        city = None
        state_region = None
        postal_code = None
        country = None
        bio = None
        if isinstance(metadata, Mapping):
            display_name = (
                metadata.get("display_name")
                or metadata.get("full_name")
                or metadata.get("name")
            )
            avatar_url = metadata.get("avatar_url")
            city = metadata.get("city")
            state_region = metadata.get("state_region")
            postal_code = metadata.get("postal_code")
            country = metadata.get("country")
            bio = metadata.get("bio")

        if not isinstance(display_name, str) or not display_name.strip():
            display_name = _derive_display_name_from_email(email)
        if not isinstance(avatar_url, str) or not avatar_url.strip() or _is_generated_avatar_url(avatar_url):
            avatar_url = None

        return AuthenticatedUser(
            id=payload["sub"],
            email=payload["email"],
            role=str(payload.get("role", "authenticated")),
            display_name=display_name,
            avatar_url=avatar_url,
            city=city,
            state_region=state_region if isinstance(state_region, str) else None,
            postal_code=postal_code if isinstance(postal_code, str) else None,
            country=country,
            bio=bio if isinstance(bio, str) else None,
            created_at=payload.get("created_at") if isinstance(payload.get("created_at"), str) else None,
        )


token_verifier = SupabaseTokenVerifier(get_settings())


class SupabaseProfileService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._rest = (
            SupabaseRestClient(settings)
            if settings.supabase_project_url and settings.supabase_service_role_key
            else None
        )

    async def get_current_user(self, current_user: AuthenticatedUser) -> AuthenticatedUser:
        normalized_user = self._with_fallback_profile(current_user)
        if self._rest is None:
            return normalized_user

        rows = await self._rest.select(
            "users",
            columns="id,email,role,display_name,avatar_url,city,country,created_at",
            filters={"id": f"eq.{current_user.id}"},
        )
        if not rows:
            return normalized_user

        return self._merge_user_row(normalized_user, rows[0])

    async def update_current_user(
        self,
        *,
        access_token: str,
        current_user: AuthenticatedUser,
        payload: AuthenticatedUserUpdate,
    ) -> AuthenticatedUser:
        if payload.email != current_user.email:
            raise ApiException(
                status_code=400,
                code="email_change_not_allowed",
                message="Email address changes are not allowed here.",
            )

        project_url = self._settings.supabase_project_url
        api_key = self._settings.supabase_publishable_key or self._settings.supabase_service_role_key
        if not project_url or not api_key:
            raise ApiException(
                status_code=503,
                code="supabase_not_configured",
                message="Supabase auth is not configured on the API server.",
            )

        user_metadata = {
            "display_name": payload.display_name,
            "avatar_url": payload.avatar_url,
            "city": payload.city,
            "state_region": payload.state_region,
            "postal_code": payload.postal_code,
            "country": payload.country,
            "bio": payload.bio,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.put(
                    f"{project_url.rstrip('/')}/auth/v1/user",
                    headers={
                        "apikey": api_key,
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "data": user_metadata,
                    },
                )
                response.raise_for_status()
                auth_payload = response.json()
        except httpx.HTTPStatusError as exc:
            message = "Unable to update this profile."
            try:
                error_payload = exc.response.json()
            except ValueError:
                error_payload = None
            if isinstance(error_payload, Mapping):
                message = str(
                    error_payload.get("msg")
                    or error_payload.get("message")
                    or error_payload.get("error_description")
                    or message
                )
            raise ApiException(
                status_code=exc.response.status_code,
                code="profile_update_failed",
                message=message,
            ) from exc
        except httpx.HTTPError as exc:
            raise ApiException(
                status_code=502,
                code="profile_update_failed",
                message="Unable to reach Supabase auth to update this profile.",
            ) from exc

        if self._rest is not None:
            updated_user_row = await self._rest.update(
                "users",
                payload={
                    "display_name": payload.display_name,
                    "avatar_url": payload.avatar_url,
                    "city": payload.city,
                    "country": payload.country,
                },
                filters={"id": f"eq.{current_user.id}"},
            )
        else:
            updated_user_row = None

        claims = {
            "sub": auth_payload["id"],
            "email": auth_payload["email"],
            "role": auth_payload.get("role", current_user.role),
            "user_metadata": auth_payload.get("user_metadata", {}),
            "created_at": auth_payload.get("created_at"),
        }
        next_user = token_verifier._build_user_from_claims(claims)
        if updated_user_row is None:
            return next_user
        return self._merge_user_row(next_user, updated_user_row)

    def _merge_user_row(
        self,
        current_user: AuthenticatedUser,
        user_row: Mapping[str, object],
    ) -> AuthenticatedUser:
        user_row_avatar = user_row.get("avatar_url")
        merged_avatar = (
            current_user.avatar_url
            if _is_generated_avatar_url(user_row_avatar)
            else user_row_avatar or current_user.avatar_url
        )

        return current_user.model_copy(
            update={
                "email": user_row.get("email") or current_user.email,
                "role": user_row.get("role") or current_user.role,
                "display_name": user_row.get("display_name") or current_user.display_name,
                "avatar_url": merged_avatar,
                "city": user_row.get("city") or current_user.city,
                "state_region": user_row.get("state_region") or current_user.state_region,
                "postal_code": user_row.get("postal_code") or current_user.postal_code,
                "country": user_row.get("country") or current_user.country,
                "bio": user_row.get("bio") or current_user.bio,
                "created_at": user_row.get("created_at") or current_user.created_at,
            }
        )

    def _with_fallback_profile(self, current_user: AuthenticatedUser) -> AuthenticatedUser:
        display_name = current_user.display_name or _derive_display_name_from_email(current_user.email)
        avatar_url = None if _is_generated_avatar_url(current_user.avatar_url) else current_user.avatar_url

        return current_user.model_copy(
            update={
                "display_name": display_name,
                "avatar_url": avatar_url,
            }
        )


profile_service = SupabaseProfileService(get_settings())
