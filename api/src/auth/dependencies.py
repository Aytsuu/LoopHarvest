from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.schemas import AuthenticatedUser
from src.auth.service import token_verifier
from src.exceptions import ApiException

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise ApiException(
            status_code=401,
            code="authentication_required",
            message="Authentication is required for this operation.",
        )
    return token_verifier.verify_access_token(credentials.credentials)


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
